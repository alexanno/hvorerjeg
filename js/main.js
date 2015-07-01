var Norkart = {};

$(document).ready(function() {
	$(".togglemap").click(function() {
		$("#kart").toggle();
		Norkart.map.invalidateSize();
		Norkart.map.setView(Norkart.gpsMarker.getLatLng(),17);
	});

	Norkart.isQuerying = false;
	Norkart.lastQuery = 0;
	Norkart.getStedsnavn = function(latlng) {
		console.log("getStedsnavn " + latlng);
		var timesincelastquery = (Date.now() - Norkart.lastQuery)/1000;
		console.log(timesincelastquery);

		if(Norkart.isQuerying === false && timesincelastquery > 3) {
			Norkart.lastQuery = Date.now();
			Norkart.isQuerying = true;
 
			var gpsgeom = "ST_Transform(ST_SetSRID(ST_MakePoint("+latlng.lng+","+latlng.lat+"),4326),3045)";
			var query = "SELECT " + 
				"ST_AsText(ST_Transform(wkb_geometry,4326)) wkt, "+
				"ST_Distance(wkb_geometry, "+gpsgeom+") avstand, " + 
				"snavn " + 
				"from stedsnavn.stedsnavn_alle " + 
				"where objtype='SSRForekomst' "+
				"order by wkb_geometry <-> "+gpsgeom + 
				"limit 7";
			var url = "http://46.101.4.130/stedsnavn/getstedsnavn.php?sql="+query;
			console.log(url);
			$.get(url, function(data) {
				console.log(data);
				Norkart.isQuerying = false;
				var $stedsnavnliste = $(".stedsnavnliste").html("");
				for(var k in data) {
					var sted = data[k];
					
					//var stedsnavnUrl = "http://faktaark.statkart.no/SSRFakta/faktaarkfraobjektid?enhet=233181" + sted.ssrid;

					var $stedsnavn = $("<h3>").html(sted.snavn + "  (" + (sted.avstand/1000).toFixed(2) + " km)");
					$stedsnavnliste.append($stedsnavn);



					var l = omnivore.wkt.parse(sted.wkt);
					l.eachLayer(function(layer) {
						var koord = layer.feature.geometry.coordinates;
						var m = L.circleMarker([koord[0][1],koord[0][0]])
							.bindLabel(sted.snavn, { noHide: true })
							.addTo(Norkart.map);

						
					});
					
					//l.bindPopup(sted.snavn).openPopup();
				}
			})
		}
	}


	Norkart.map = new WebatlasMap('kart', {
        customer: "WA_demo" //ved kommersiell bruk send epost til alexander.nossum@norkart.no
    });

	Norkart.map.eachLayer(function(layer) {
		Norkart.map.removeLayer(layer);
	});
	/*** GeoLocation */
    //trigger HTML5 GeoLocation via Leaflet
    Norkart.map.locate({
        setView: false,
        maxZoom: 15,
        enableHighAccuracy: true,
        watch: true
    });

    //definerer funksjon som skal kjøres ved event nedenfor
    function onLocationFound(e) {
        var radius = e.accuracy / 2;
        console.log(e.latlng);
        $("#gpsradius").html(radius + " meter ");
        $("#gpscoord").html("lat: " + e.latlng.lat.toFixed(6) + " lng: " + e.latlng.lng.toFixed(6));

        if (typeof Norkart.gpsMarker === 'object') {
            Norkart.map.removeLayer(Norkart.gpsMarker);
            Norkart.map.removeLayer(Norkart.gpsCircle);
        }

        //Lager en ny markør med koordinater (latlng) som fått igjennom "locationfound"-eventet
        Norkart.gpsMarker = L.marker(e.latlng)
        	//.bindLabel("Du er innenfor " + radius + " meter av dette punktet.", { noHide: true })
        	.addTo(Norkart.map);

        //lager en sirkel med senter i koordinaten og radius = nøyaktighet/2
        Norkart.gpsCircle = L.circle(e.latlng, radius).addTo(Norkart.map);
        console.log(e);
        Norkart.getStedsnavn(e.latlng);
    }
    //definerer funksjon som skal kjøres ved event nedenfor
    function onLocationError(e) {
        alert(e.message);
    }

    //setter opp "eventlisteners" som lytter på "locationfound" og "locationerror"
    Norkart.map.on('locationfound', onLocationFound);
    Norkart.map.on('locationerror', onLocationError);

});
