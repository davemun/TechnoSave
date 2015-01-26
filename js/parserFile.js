var Promise = require("bluebird");
var request = Promise.promisify(require('request'));

var config = require('config');
//==============Walmart API URIs======================
var searchUrl = config.get('APIKeys.WalMart.searchUrl');
var itemIDLookupUrl = config.get('APIKeys.WalMart.itemIDLookupUrl');
var APIKey = config.get('APIKeys.WalMart.key');
//==============Walmart API URIs======================

//==============BestBuy API URIs======================
var BBsearchUrl = config.get('APIKeys.BestBuy.searchUrl');
var BBAPIKey = config.get('APIKeys.BestBuy.key');
//==============BestBuy API URIs======================
 
module.exports = {
  parser : function(req, res){
    //create itemsList array of user inputs, whitespace sanitized and put in array
    var itemsList = req.body.items.replace(/ /g,'').split(','),
        output = [],
        max = 10,        //number of matching requests per API per item
        APIs = 2,       //number of APIs were using
        completed = 0,  //number of completed async http req
        queued = itemsList.length*APIs*max; //number of queued async http req

    //go through itemsList array of user inputs and get price for each from Wal-Mart API
    for(var i = 0; i < itemsList.length; i++){
        //construct GET url
        var getURL = (searchUrl + '?apiKey=' + APIKey + '&query=' + itemsList[i]);
        //http://api.remix.bestbuy.com/v1/products(name=cable*)?show=name,salePrice,sku&format=json&apiKey=3fywvy298naxeed665ex82z5
        var BBgetURL = (BBsearchUrl + '(name=' + itemsList[i] + '*)?show=name,salePrice,sku&format=json' + '&apiKey=' + BBAPIKey);

        //=================Walmart API requests====================
        //ask walmart API for data
        request(getURL)
        //async callback to parse data
        .then(function(data){
            //create list of item objects - limited to var "max" results per item.
                //if query results are empty, set to empty array and API module will exit.
            if(JSON.parse(data[0].body).items !== undefined){
                var apiItemsList = JSON.parse(data[0].body).items.slice(0, max);
            }else{
                var apiItemsList = [];                
                completed += itemsList.length*max;
            }
           
            //for list of matching products, trim object and add to output  
            apiItemsList.forEach(function(itemObj){
                //construct new item object
                var apiItem = {};

                //get price, itemID, and name
                    //if salePrice does not exist, default to MSRP
                apiItem.price = itemObj.salePrice || itemObj.msrp;
                apiItem.itemId = itemObj.itemId;
                apiItem.name = itemObj.name;
                apiItem.store = "WalMart";
                
                //store item info obj (that is a possible match) into the output
                output.push(apiItem);
                completed++;
            });

            //if query that just finished is the last item in the search terms,
            //send data back to client
            if(completed === queued){
                res.send(output);
            } 
        });
        //=================Walmart API requests====================

        //=================BestBuy API requests====================
        //ask walmart API for data
        request(BBgetURL)
        //async callback to parse data
        .then(function(data){
            //create list of item objects - limited to var "max" results per item.
                //if query results are empty, set to empty array and API module will exit.
            if(JSON.parse(data[0].body).products.length !== 0){
                var apiItemsList = JSON.parse(data[0].body).products.slice(0, max);
            }else{
                var apiItemsList = [];    
                completed += itemsList.length*max;            
            }
            
            //for list of matching products, trim object and add to output  
            apiItemsList.forEach(function(itemObj){
                //construct new item object
                var apiItem = {};

                //get price, itemID, and name
                    //if salePrice does not exist, default to MSRP
                apiItem.price = itemObj.salePrice;
                apiItem.itemId = itemObj.sku;
                apiItem.name = itemObj.name;
                apiItem.store = "Best Buy";
                
                //store item info obj (that is a possible match) into the output
                output.push(apiItem);
                completed++;
            });

            //if query that just finished is the last item in the search terms,
            //send data back to client
            if(completed === queued){
                res.send(output);
            } 
        });
        //=================BestBuy API requests====================
    }
  }
}