sap.ui.define(
    [
      './BaseController',
      'sap/ui/model/json/JSONModel',
      'sap/ui/core/date/UI5Date',
      'sap/ui/core/routing/History',
      'mycompany/myapp/MyWorklistApp/model/formatter',
      'sap/ui/core/format/DateFormat',
      'sap/ui/model/Filter',
      'sap/ui/model/FilterOperator'
    ],
    function (
      BaseController,
      JSONModel,
      UI5Date,
      History,
      formatter,
      DateFormat,
      Filter,
      FilterOperator
    ) {
      'use strict'
  
      return BaseController.extend(
        'mycompany.myapp.MyWorklistApp.controller.Frame',
        {
          formatter: formatter,
  
          /* =========================================================== */
          /* lifecycle methods                                           */
          /* =========================================================== */
  
          /**
           * Called when the worklist controller is instantiated.
           * @public
           */
          onInit: function () {
            
            this.getRouter().getTargets().getTarget("frame").attachDisplay(null, this._onDisplay, this);
            this._oODataModel = this.getOwnerComponent().getModel();
            this._oResourceBundle = this.getResourceBundle();
            this._oViewModel = new JSONModel({
              trnum: "",
              enableCreate: false,
              delay: 0,
              busy: false,
              mode: "",
              viewTitle: ""
            });
            this.setModel(this._oViewModel, "frameView");
                        
          },

          _onDisplay: function (oEvent) {
            
          },
  
          /* =========================================================== */
          /* event handlers                                              */
          /* =========================================================== */
  
          /**
           * Event handler  for navigating back.
           * It there is a history entry we go one step back in the browser history
           * If not, it will replace the current entry of the browser history with the worklist route.
           * @public
           */
          onNavBack: function () {
            var sPreviousHash = History.getInstance().getPreviousHash()
  
            if (sPreviousHash !== undefined) {
              history.go(-1)
            } else {
              this.getRouter().navTo('worklist', {}, true)
            }
          },
  
          /* =========================================================== */
          /* internal methods                                            */
          /* =========================================================== */
  
          /**
           * Binds the view to the object path.
           * @function
           * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
           * @private
           */
          _onObjectMatched: function (oEvent) {
            var sObjectId = oEvent.getParameter('arguments').objectId
            var sObj = sObjectId.toString()
            var aData = this.getOwnerComponent().getModel().getData()
            var index = -1
            for (var i = 0; i < aData.length; i++) {
              if (String(aData[i].DocumentId) === sObj) {
                index = i
                break
              }
            }
  
            if (typeof index !== -1) {
              //Materials
              var aMaterials = aData[index].Materials
              var oMaterialsModel = new JSONModel()
              oMaterialsModel.setData(aMaterials)
              this.setModel(oMaterialsModel, 'Materials')
              //Invoice Items
              var aInvoiceItems = aData[index].ItemsFatura
              var oItemsFaturaModel = new JSONModel()
              oItemsFaturaModel.setData(aInvoiceItems)
              this.setModel(oItemsFaturaModel, 'ItemsFatura')
            } else {
            }
  
            /* 			var sObjectPath = this.getModel().createKey("ImportDocuments", {
          DocumentId :  sObjectId
        }); */
            /* 			this.getModel().metadataLoaded().then( function() {
          var sObjectPath = this.getModel().createKey("ImportDocuments", {
            DocumentId :  sObjectId
          });
          this._bindView("/" + sObjectPath);
        }.bind(this)); */
          },
  
          /**
           * Binds the view to the object path.
           * @function
           * @param {string} sObjectPath path to the object to be bound
           * @private
           */
          _bindView: function (sObjectPath) {
            var oViewModel = this.getModel('objectView'),
              oDataModel = this.getModel()
  
            this.getView().bindElement({
              path: sObjectPath,
              events: {
                change: this._onBindingChange.bind(this),
                dataRequested: function () {
                  oDataModel.metadataLoaded().then(function () {
                    // Busy indicator on view should only be set if metadata is loaded,
                    // otherwise there may be two busy indications next to each other on the
                    // screen. This happens because route matched handler already calls '_bindView'
                    // while metadata is loaded.
                    oViewModel.setProperty('/busy', true)
                  })
                },
                dataReceived: function () {
                  oViewModel.setProperty('/busy', false)
                }
              }
            })
          },
  
          _onBindingChange: function () {
            var oView = this.getView(),
              oViewModel = this.getModel('objectView'),
              oElementBinding = oView.getElementBinding()
  
            // No data for the binding
            if (!oElementBinding.getBoundContext()) {
              this.getRouter().getTargets().display('objectNotFound')
              return
            }
  
            var oResourceBundle = this.getResourceBundle(),
              oObject = oView.getBindingContext().getObject(),
              sObjectId = oObject.ProductID,
              sObjectName = oObject.ProductName
  
            oViewModel.setProperty('/busy', false)
            oViewModel.setProperty(
              '/shareSendEmailSubject',
              oResourceBundle.getText('shareSendEmailObjectSubject', [sObjectId])
            )
            oViewModel.setProperty(
              '/shareSendEmailMessage',
              oResourceBundle.getText('shareSendEmailObjectMessage', [
                sObjectName,
                sObjectId,
                location.href
              ])
            )
  
            // Update the comments in the list
            var oList = this.byId('idCommentsList')
            var oBinding = oList.getBinding('items')
            oBinding.filter(new Filter('productID', FilterOperator.EQ, sObjectId))
          },
  
          /**
           * Updates the model with the user comments on Products.
           * @function
           * @param {sap.ui.base.Event} oEvent object of the user input
           */
          onPost: function (oEvent) {
            var oFormat = DateFormat.getDateTimeInstance({ style: 'medium' })
            var sDate = oFormat.format(UI5Date.getInstance())
            var oObject = this.getView().getBindingContext().getObject()
            var sValue = oEvent.getParameter('value')
            var oEntry = {
              productID: oObject.ProductID,
              type: 'Comment',
              date: sDate,
              comment: sValue
            }
            // update model
            var oFeedbackModel = this.getModel('productFeedback')
            var aEntries = oFeedbackModel.getData().productComments
            aEntries.push(oEntry)
            oFeedbackModel.setData({
              productComments: aEntries
            })
          }
        }
      )
    }
  )
  