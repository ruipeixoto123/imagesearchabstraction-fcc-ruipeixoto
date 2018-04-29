// requirements
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const searchTerm = require('./searchTerm');

const app = express();
app.use(bodyParser.json());
app.use(cors());


var Bing = require('node-bing-api')({accKey:process.env.BING_KEY});

// connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/searchTerms'); 

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
}); 


app.get('/api/recentsearchs', function(req,res){
	searchTerm.find({}, function(err, data){
		res.json(data);
	});
});


app.get('/api/imagesearch/:searchVal*', function(req, res){
	var searchVal = req.params.searchVal;
	var offset = req.query.offset;

	var data = new searchTerm({
		searchVal,
		searchDate: new Date()
	});

	data.save(function(err){
		if(err){
			return res.send('Error saving to database');
		}	
	});

  var searchOffset;
	//does offset exists
	if(offset){
		if(offset == 1){
			offset = 0;
			searchOffset = 1;
		} else if(offset > 1){
			searchOffset = offset + 1;
		}
	} else {
		offset = 0;
		searchOffset = 1;
	}

	Bing.images(searchVal, {
  		count: (10 * searchOffset),   // Number of results (max 50)
  		offset: (10 * offset)    // Skip first 3 result
  	}, function(error, request, body){
  		var bingData = [];
    
    

  		for(let i = 0; i < 10 ; i++){
  			bingData.push({
  				url: body.value[i].webSearchUrl,
  				snippet: body.value[i].name,
  				thumbnail: body.value[i].thumbnailUrl,
  				context: body.value[i].hostPageDisplayUrl
  			});	
  		} 
  		res.json(bingData); 
  	});
});


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
