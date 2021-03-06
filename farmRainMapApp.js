var express    = require('express');
var fs 		   = require('fs');
var jsonfile   = require('jsonfile');
var geoJson    = require('geojson');
var bodyParser = require('body-parser');
//var lazy       = require('lazy');

//Initialize Database connections
var db_file = "RAINAPP.db";      		//pass in databse files
var exist = fs.existsSync(db_file); 	//check if files exists
console.log(exist);
var sqlite3 = require('sqlite3').verbose(); 	//connect to database
var db = new sqlite3.Database('RAINAPP.db');	

console.log('Connecting to Database');

var app = express();
app.use(bodyParser.json()); //support json encoded bodies
app.use(bodyParser.urlencoded({extended: true }));//support encoded body
var wells = [];
loadWells(wells);

app.set('views', __dirname + '/views');
app.use(express.static( __dirname + '/resources'));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');


app.get('/Well_Levels', function(req, res){
	
	res.render('google-maps.html', {well_data: wells});
});

//JSON well dump
app.get('/', function(req, res){
	
	res.json(wells);
});

app.get('/heatmap', function(req, res){
	
	res.render('heatMaps.html', {wellLocations: wellInfo});
});

app.get('/scalable', function(req, res){
	
	res.render('scalableMap.html', {well_data: wells});
});

//SMS DUMP APPEND TO FILE
app.post('/api/smsdump', function(req, res){
	//retrive POST DATA
	//http://www.domain-name.com/keyword.php?mobile=9945xxxxxx&msg=UD9945xxxxxx
	var number = req.body.mobile;
	var msg = req.body.msg;
	console.log(number + ":" + msg);
	res.send("Number=" + number + " Message=" + msg);
	//Parse msg format = SMA 313603 280715 012 34.5

	fs.appendFile('smsDump.log', number + '::' + msg + '\r\n');
	//Write and append data to a file
	//this is just for safe keeping

});


app.get('/api/wells', function(req, res){
	res.json(wells);
});


//Recieve Post request from app:
app.post('/api/report', function(req, res){

	var number = 12345; //just a dummy number
	var postcode = req.body.postcode;
	var date = req.body.date; //TODO: format/strip date
	var wellID = req.body.wellID;
	var depth = parseFloat(req.body.depth);

	var msg = postcode + " " + date + " " + wellID + " " + depth;
	
	//message has format: postcode date wellid depth
	if ((postcode != null) && (date != null) && (wellID != null) && (depth != null) && (isNaN(depth)) != true) {
		res.send("Submitted=True" + " Message="+msg);

		//We will dump to appDump.log - keeping the same format as the other file. the number is just a dummy number
		//but could be useful later on.
		fs.appendFile('appDump.log', number + '::' + msg + '\r\n');
	} else {
		res.status(500)
		.send({ 'message': 'There was an error with your data. Please check your fields and try again.' });
	}
});


//pass empty list to get filled by the query 
function loadWells(wells){
		//TODO: Change query to inner join that  includes well level 
		var sqlQuery = "SELECT * FROM Well_Locations NATURAL JOIN (SELECT h.ID AS ID, h.TOT_WELL_DEPTH_m AS TOT_WELL_DEPTH_m, h.T_STAMP AS T_STAMP FROM Well_History as h JOIN LastReading as l on(h.ID = l.ID) WHERE h.T_STAMP = l.DATE) "
		db.each(sqlQuery, function(err, row) {
			//console.log(row);
			if(err) console.log(err);
			//console.log(myData);
			var latitude = Number(row.LAT_DEGREE) + Number(row.LAT_MINUTE)/60 + (Number(row.LAT_SECOND) + Number("." + row.LAT_DECIMAL))/3600;
			//console.log("Latitude: " + latitude);
			var longitude = Number(row.LNG_DEGREE) + Number(row.LNG_MINUTE)/60 + (Number(row.LNG_SECOND) + Number("." + row.LNG_DECIMAL))/3600;
			//console.log("longitude: " + longitude);
			var well = {Id:row.ID, lat: latitude, lng: longitude, Elevation: row.ELEVATION_m, Level: row.TOT_WELL_DEPTH_m, TimeStamp: row.T_STAMP };
			//add a well to the list
			wells.push(well);
			console.log('Added: '+ well.Id);

		}, function(err, rows){
			//quety completed with more than 1 row so we will convert the new data to geoJson and update the old geoJson
			if(rows > 0){
				console.log("Completed Query");
				wells = geoJson.parse(wells, {Point: ['lat', 'lng']});
				//saveWells('views/wellsGeoJson.json', wells); NOT NEEDED
			}
		}

		);




}

function saveWells(file, obj){
	jsonfile.writeFile(file, obj, function(err) {
		if(err) console.error(err);
	});
}

// function smsParseUnitTest(){
// 	new lazy(fs.createReadStream('./smsDump.log'))
//         .lines
//         .forEach(function(line){
//             //line --> SMA::PostalCode Date WellID Depth
//             console.log(line.toString());
//             var str = line.split("::")[1].split(" ").filter(Boolean);

//             //str --> [PostalCode, Date, WellID, Depth]
//             console.log(str.toString());
//             if(str.length == 4) {
//                 //Convert ddmmyy to YYYY-MM-DD
//                 //var postalcode = str[0] //IGNORED
//                 var date = str[1].replace(/(\d{2})(\d{2})(\d{2})/g, '20$3-$2-$1'); 
//                 var wellID = str[2];
//                 var depth = str[3];

//                 //Loading values into db
//                 var stmt = db.prepare("INSERT INTO Well_Levels VALUES (?,?,?)");
//                 stmt.run(wellID, depth, date);
//                 stmt.finalize();
//             }
//             //console.log(line.toString());
//         }
// }

// function parseLatLong(row){
// 		//console.log(myData);
// 		var latitude = Number(row.LAT_DEGREE) + Number(row.LAT_MINUTE)/60 + Number(row.LAT_SECOND)/3600;
// 		//console.log("Latitude: " + latitude);
// 		var longitude = Number(row.LNG_DEGREE) + Number(row.LNG_MINUTE)/60 + Number(row.LNG_SECOND)/3600;
// 		//console.log("longitude: " + longitude);
// 		var latLng = {'WellId':row.ID, 'Latitude': latitude, 'Longitude': longitude }
// 		console.log(latLng);

// 		return {latLng};
// }


app.listen(8888);	
console.log('Started server on port 8888');