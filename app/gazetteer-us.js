/* gazetteer-us.js: offline US place lookup for inCommon birth locations. V1.0.0

   SCOPE, STATED PLAINLY: this file carries ~430 hand-checked US places: all 50
   state capitals, the largest cities in every state, and a set of landmark
   proxies. It is NOT the full "every incorporated place over 1,000 people" set
   (~19,500 rows, ~1.2 MB raw / ~350 KB gzipped). Coordinates here are real to
   ~4 decimals; a synthesised 19,500-row file would have been mostly wrong
   numbers wearing a precise-looking format, which is worse than a smaller true
   one for a chart that depends on longitude.

   To install the full set later, drop a rows array in the same packed shape and
   call Gazetteer.load(rows). Search, ranking, and the profile form pick it up
   with no further changes. Census "Gazetteer Files (Places)" is the usual free
   source; it ships name, state, lat, lon and needs a timezone join.

   Packed row: "Name,lat,lon,pop[,tz]". A tz omitted means the state default. */
(function () {
  'use strict';

  /* tz code -> [IANA, standard UTC offset, observes DST] */
  var TZ = {
    E: ['America/New_York', -5, true], C: ['America/Chicago', -6, true],
    M: ['America/Denver', -7, true], P: ['America/Los_Angeles', -8, true],
    Z: ['America/Phoenix', -7, false], A: ['America/Anchorage', -9, true],
    H: ['Pacific/Honolulu', -10, false]
  };

  var STATE_TZ = {
    AL:'C',AK:'A',AZ:'Z',AR:'C',CA:'P',CO:'M',CT:'E',DE:'E',DC:'E',FL:'E',GA:'E',HI:'H',ID:'M',IL:'C',
    IN:'E',IA:'C',KS:'C',KY:'E',LA:'C',ME:'E',MD:'E',MA:'E',MI:'E',MN:'C',MS:'C',MO:'C',MT:'M',NE:'C',
    NV:'P',NH:'E',NJ:'E',NM:'M',NY:'E',NC:'E',ND:'C',OH:'E',OK:'C',OR:'P',PA:'E',RI:'E',SC:'E',SD:'C',
    TN:'C',TX:'C',UT:'M',VT:'E',VA:'E',WA:'P',WV:'E',WI:'C',WY:'M',PR:'E'
  };

  var STATE_NAME = {
    AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',
    DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',
    IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',
    MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',
    NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',
    OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
    SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
    WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',PR:'Puerto Rico'
  };

  /* Capitals get a flag so they always survive ranking and truncation. */
  var CAPITALS = {
    AL:'Montgomery',AK:'Juneau',AZ:'Phoenix',AR:'Little Rock',CA:'Sacramento',CO:'Denver',CT:'Hartford',
    DE:'Dover',FL:'Tallahassee',GA:'Atlanta',HI:'Honolulu',ID:'Boise',IL:'Springfield',IN:'Indianapolis',
    IA:'Des Moines',KS:'Topeka',KY:'Frankfort',LA:'Baton Rouge',ME:'Augusta',MD:'Annapolis',MA:'Boston',
    MI:'Lansing',MN:'Saint Paul',MS:'Jackson',MO:'Jefferson City',MT:'Helena',NE:'Lincoln',NV:'Carson City',
    NH:'Concord',NJ:'Trenton',NM:'Santa Fe',NY:'Albany',NC:'Raleigh',ND:'Bismarck',OH:'Columbus',
    OK:'Oklahoma City',OR:'Salem',PA:'Harrisburg',RI:'Providence',SC:'Columbia',SD:'Pierre',TN:'Nashville',
    TX:'Austin',UT:'Salt Lake City',VT:'Montpelier',VA:'Richmond',WA:'Olympia',WV:'Charleston',
    WI:'Madison',WY:'Cheyenne',PR:'San Juan'
  };

  var DATA = {
    AL: 'Birmingham,33.5186,-86.8104,196910|Montgomery,32.3668,-86.3000,200603|Huntsville,34.7304,-86.5861,215006|Mobile,30.6954,-88.0399,187041|Tuscaloosa,33.2098,-87.5692,101129|Auburn,32.6099,-85.4808,76143|Dothan,31.2232,-85.3905,71072|Decatur,34.6059,-86.9833,57938|Florence,34.7998,-87.6773,40184|Gadsden,34.0143,-86.0066,33945',
    AK: 'Anchorage,61.2181,-149.9003,291247|Juneau,58.3019,-134.4197,32255|Fairbanks,64.8378,-147.7164,32515|Sitka,57.0531,-135.3300,8458|Ketchikan,55.3422,-131.6461,8192|Wasilla,61.5814,-149.4394,9054|Kodiak,57.7900,-152.4072,5581|Nome,64.5011,-165.4064,3699',
    AZ: 'Phoenix,33.4484,-112.0740,1608139|Tucson,32.2226,-110.9747,542629|Mesa,33.4152,-111.8315,504258|Chandler,33.3062,-111.8413,275987|Scottsdale,33.4942,-111.9261,241361|Glendale,33.5387,-112.1860,248325|Gilbert,33.3528,-111.7890,267918|Tempe,33.4255,-111.9400,180587|Peoria,33.5806,-112.2374,190985|Flagstaff,35.1983,-111.6513,76831|Yuma,32.6927,-114.6277,95548|Prescott,34.5400,-112.4685,45827|Sedona,34.8697,-111.7610,9684|Page,36.9147,-111.4558,7247',
    AR: 'Little Rock,34.7465,-92.2896,202591|Fort Smith,35.3859,-94.3985,89142|Fayetteville,36.0626,-94.1574,93949|Springdale,36.1867,-94.1288,84161|Jonesboro,35.8423,-90.7043,78576|North Little Rock,34.7695,-92.2671,64591|Conway,35.0887,-92.4421,64134|Hot Springs,34.5037,-93.0552,37930|Pine Bluff,34.2284,-92.0032,41253|Bentonville,36.3729,-94.2088,54164',
    CA: 'Los Angeles,34.0522,-118.2437,3898747|San Diego,32.7157,-117.1611,1386932|San Jose,37.3382,-121.8863,1013240|San Francisco,37.7749,-122.4194,873965|Fresno,36.7378,-119.7871,542107|Sacramento,38.5816,-121.4944,524943|Long Beach,33.7701,-118.1937,466742|Oakland,37.8044,-122.2712,440646|Bakersfield,35.3733,-119.0187,403455|Anaheim,33.8366,-117.9143,346824|Santa Ana,33.7455,-117.8677,310227|Riverside,33.9806,-117.3755,314998|Stockton,37.9577,-121.2908,320804|Irvine,33.6846,-117.8265,307670|Chula Vista,32.6401,-117.0842,275487|Fremont,37.5485,-121.9886,230504|San Bernardino,34.1083,-117.2898,222101|Modesto,37.6391,-120.9969,218464|Fontana,34.0922,-117.4350,208393|Oxnard,34.1975,-119.1771,202063|Moreno Valley,33.9425,-117.2297,208634|Huntington Beach,33.6595,-117.9988,198711|Glendale,34.1425,-118.2551,196543|Santa Clarita,34.3917,-118.5426,228673|Garden Grove,33.7743,-117.9380,171949|Oceanside,33.1959,-117.3795,174068|Rancho Cucamonga,34.1064,-117.5931,174453|Santa Rosa,38.4404,-122.7141,178127|Ontario,34.0633,-117.6509,175265|Elk Grove,38.4088,-121.3716,176124|Corona,33.8753,-117.5664,157136|Lancaster,34.6868,-118.1542,173516|Palmdale,34.5794,-118.1165,169450|Salinas,36.6777,-121.6555,163542|Hayward,37.6688,-122.0808,162954|Pomona,34.0551,-117.7500,151713|Escondido,33.1192,-117.0864,151038|Sunnyvale,37.3688,-122.0363,155805|Torrance,33.8358,-118.3406,147067|Pasadena,34.1478,-118.1445,138699|Orange,33.7879,-117.8531,139911|Fullerton,33.8704,-117.9243,143617|Thousand Oaks,34.1706,-118.8376,126966|Visalia,36.3302,-119.2921,141384|Simi Valley,34.2694,-118.7815,126356|Concord,37.9780,-122.0311,125410|Roseville,38.7521,-121.2880,147773|Santa Clara,37.3541,-121.9552,127647|Vallejo,38.1041,-122.2566,126090|Victorville,34.5362,-117.2928,134810|Berkeley,37.8715,-122.2730,124321|Fairfield,38.2494,-122.0400,119881|Richmond,37.9358,-122.3477,116448|Murrieta,33.5539,-117.2139,110949|Antioch,38.0049,-121.8058,115291|Temecula,33.4936,-117.1484,110003|Costa Mesa,33.6411,-117.9187,111918|Ventura,34.2746,-119.2290,110763|Downey,33.9401,-118.1332,114355|Carlsbad,33.1581,-117.3506,114746|Santa Maria,34.9530,-120.4357,109707|El Monte,34.0686,-118.0276,109450|Inglewood,33.9617,-118.3531,107762|Santa Monica,34.0195,-118.4912,93076|Burbank,34.1808,-118.3090,107337|San Mateo,37.5630,-122.3255,105661|Redding,40.5865,-122.3917,93611|Chico,39.7285,-121.8375,101475|Palo Alto,37.4419,-122.1430,68572|Napa,38.2975,-122.2869,79246|San Luis Obispo,35.2828,-120.6596,47063|Monterey,36.6002,-121.8947,30218|Santa Barbara,34.4208,-119.6982,88665|Eureka,40.8021,-124.1637,26512|Bakersfield Oildale,35.4194,-119.0195,32684|Merced,37.3022,-120.4830,86333|Turlock,37.4947,-120.8466,72740|Tracy,37.7397,-121.4252,93000|Manteca,37.7974,-121.2161,83498|Davis,38.5449,-121.7405,66850|Yuba City,39.1404,-121.6169,70117|Vacaville,38.3566,-121.9877,102386|San Rafael,37.9735,-122.5311,58994|Novato,38.1074,-122.5697,53225|Petaluma,38.2324,-122.6367,59776|Truckee,39.3280,-120.1833,16180|Palm Springs,33.8303,-116.5453,44575|Indio,33.7206,-116.2156,89137|El Centro,32.7920,-115.5631,44322|Barstow,34.8958,-117.0173,25415',
    CO: 'Denver,39.7392,-104.9903,715522|Colorado Springs,38.8339,-104.8214,478961|Aurora,39.7294,-104.8319,386261|Fort Collins,40.5853,-105.0844,169810|Lakewood,39.7047,-105.0814,155984|Thornton,39.8680,-104.9719,141867|Arvada,39.8028,-105.0875,124402|Westminster,39.8367,-105.0372,116317|Pueblo,38.2544,-104.6091,111876|Boulder,40.0150,-105.2705,108250|Greeley,40.4233,-104.7091,108795|Longmont,40.1672,-105.1019,98885|Loveland,40.3978,-105.0750,76378|Grand Junction,39.0639,-108.5506,65560|Broomfield,39.9205,-105.0867,74112|Castle Rock,39.3722,-104.8561,73158|Durango,37.2753,-107.8801,19071|Aspen,39.1911,-106.8175,7004|Vail,39.6403,-106.3742,4835|Steamboat Springs,40.4850,-106.8317,13224',
    CT: 'Bridgeport,41.1865,-73.1952,148654|New Haven,41.3083,-72.9279,134023|Stamford,41.0534,-73.5387,135470|Hartford,41.7658,-72.6734,121054|Waterbury,41.5582,-73.0515,114403|Norwalk,41.1177,-73.4082,91184|Danbury,41.3948,-73.4540,86518|New Britain,41.6612,-72.7795,74135|Bristol,41.6718,-72.9493,60833|Meriden,41.5382,-72.8070,60850|Milford,41.2223,-73.0565,50558|Greenwich,41.0262,-73.6282,63518|Middletown,41.5623,-72.6506,47717|New London,41.3557,-72.0995,27367',
    DE: 'Wilmington,39.7391,-75.5398,70898|Dover,39.1582,-75.5244,39403|Newark,39.6837,-75.7497,31454|Middletown,39.4496,-75.7163,23745|Rehoboth Beach,38.7168,-75.0760,1108|Lewes,38.7746,-75.1393,3266',
    DC: 'Washington,38.9072,-77.0369,689545|Georgetown,38.9097,-77.0654,0',
    FL: 'Jacksonville,30.3322,-81.6557,949611|Miami,25.7617,-80.1918,442241|Tampa,27.9506,-82.4572,384959|Orlando,28.5383,-81.3792,307573|Saint Petersburg,27.7676,-82.6403,258308|Hialeah,25.8576,-80.2781,223109|Port Saint Lucie,27.2730,-80.3582,204851|Tallahassee,30.4383,-84.2807,196169|Cape Coral,26.5629,-81.9495,194016|Fort Lauderdale,26.1224,-80.1373,182760|Pembroke Pines,26.0031,-80.2239,171178|Hollywood,26.0112,-80.1495,153067|Gainesville,29.6516,-82.3248,141085|Miramar,25.9861,-80.3035,134721|Coral Springs,26.2712,-80.2706,134394|Clearwater,27.9659,-82.8001,117292|Palm Bay,28.0345,-80.5887,119760|West Palm Beach,26.7153,-80.0534,117415|Lakeland,28.0395,-81.9498,112641|Pompano Beach,26.2379,-80.1248,112046|Davie,26.0765,-80.2521,105691|Boca Raton,26.3683,-80.1289,97422|Sunrise,26.1669,-80.2564,97335|Deltona,28.9005,-81.2637,93692|Plantation,26.1276,-80.2331,91750|Fort Myers,26.6406,-81.8723,86395|Melbourne,28.0836,-80.6081,84678|Kissimmee,28.2920,-81.4076,79226|Homestead,25.4687,-80.4776,80737|Daytona Beach,29.2108,-81.0228,72647|Naples,26.1420,-81.7948,19115|Sarasota,27.3364,-82.5307,54842|Ocala,29.1872,-82.1401,63591|Pensacola,30.4213,-87.2169,54312,C|Panama City,30.1588,-85.6602,32267,C|Fort Walton Beach,30.4058,-86.6188,20922,C|Key West,24.5551,-81.7800,26444|Bradenton,27.4989,-82.5748,55698|Titusville,28.6122,-80.8076,48789|Vero Beach,27.6386,-80.3973,16354|Winter Haven,28.0222,-81.7329,49219|Coral Gables,25.7215,-80.2684,49248|Miami Beach,25.7907,-80.1300,82890',
    GA: 'Atlanta,33.7490,-84.3880,498715|Augusta,33.4735,-82.0105,202081|Columbus,32.4610,-84.9877,206922|Macon,32.8407,-83.6324,157346|Savannah,32.0809,-81.0912,147780|Athens,33.9519,-83.3576,127315|Sandy Springs,33.9304,-84.3733,108080|Roswell,34.0232,-84.3616,92833|Warner Robins,32.6130,-83.6242,80308|Albany,31.5785,-84.1557,69647|Alpharetta,34.0754,-84.2941,65818|Marietta,33.9526,-84.5499,60972|Valdosta,30.8327,-83.2785,55378|Smyrna,33.8840,-84.5144,55663|Dunwoody,33.9462,-84.3346,52080|Rome,34.2570,-85.1647,37713|Gainesville,34.2979,-83.8241,42296|Milledgeville,33.0801,-83.2321,17715',
    HI: 'Honolulu,21.3069,-157.8583,350964|Pearl City,21.3972,-157.9752,45295|Hilo,19.7297,-155.0900,44186|Kailua,21.4022,-157.7394,40514|Waipahu,21.3866,-158.0092,38216|Kaneohe,21.3990,-157.7983,34597|Kahului,20.8893,-156.4729,26337|Lahaina,20.8783,-156.6825,12702|Kailua-Kona,19.6400,-155.9969,19713|Lihue,21.9811,-159.3711,7345',
    ID: 'Boise,43.6150,-116.2023,235684|Meridian,43.6121,-116.3915,117635|Nampa,43.5407,-116.5635,100200|Idaho Falls,43.4666,-112.0341,64818|Pocatello,42.8713,-112.4455,56320|Caldwell,43.6629,-116.6874,59996|Coeur d Alene,47.6777,-116.7805,54628,P|Twin Falls,42.5558,-114.4701,51807|Lewiston,46.4165,-117.0177,34203,P|Moscow,46.7324,-117.0002,25435,P|Sun Valley,43.6971,-114.3517,1788',
    IL: 'Chicago,41.8781,-87.6298,2746388,C|Aurora,41.7606,-88.3201,180542,C|Naperville,41.7508,-88.1535,149540,C|Joliet,41.5250,-88.0817,150362,C|Rockford,42.2711,-89.0940,148655,C|Springfield,39.7817,-89.6501,114394,C|Elgin,42.0354,-88.2826,114797,C|Peoria,40.6936,-89.5890,113150,C|Champaign,40.1164,-88.2434,88302,C|Waukegan,42.3636,-87.8448,89321,C|Bloomington,40.4842,-88.9937,78680,C|Decatur,39.8403,-88.9548,70522,C|Evanston,42.0451,-87.6877,78110,C|Schaumburg,42.0334,-88.0834,78723,C|Arlington Heights,42.0884,-87.9806,77676,C|Cicero,41.8456,-87.7539,85268,C|Urbana,40.1106,-88.2073,38336,C|Carbondale,37.7273,-89.2168,21857,C|Moline,41.5067,-90.5151,42985,C|Rock Island,41.5095,-90.5787,37108,C|Galesburg,40.9478,-90.3712,30052,C|Quincy,39.9356,-91.4098,39463,C|Oak Park,41.8850,-87.7845,54583,C',
    IN: 'Indianapolis,39.7684,-86.1581,887642|Fort Wayne,41.0793,-85.1394,263886|Evansville,37.9716,-87.5711,117298,C|South Bend,41.6764,-86.2520,103453|Carmel,39.9784,-86.1180,99757|Fishers,39.9568,-85.9589,98977|Bloomington,39.1653,-86.5264,79968|Hammond,41.5834,-87.5000,77879,C|Gary,41.5934,-87.3464,69093,C|Lafayette,40.4167,-86.8753,70783|Muncie,40.1934,-85.3864,65194|Terre Haute,39.4667,-87.4139,58389|Kokomo,40.4864,-86.1336,59604|Anderson,40.1053,-85.6803,54788|Elkhart,41.6819,-85.9767,53923|Notre Dame,41.7001,-86.2379,5973',
    IA: 'Des Moines,41.5868,-93.6250,214133|Cedar Rapids,41.9779,-91.6656,137710|Davenport,41.5236,-90.5776,101724|Sioux City,42.4999,-96.4003,85797|Iowa City,41.6611,-91.5302,74828|Waterloo,42.4928,-92.3426,67314|Council Bluffs,41.2619,-95.8608,62799|Ames,42.0308,-93.6319,66427|West Des Moines,41.5772,-93.7113,68723|Dubuque,42.5006,-90.6646,59667|Cedar Falls,42.5278,-92.4455,40713|Mason City,43.1536,-93.2010,27338',
    KS: 'Wichita,37.6872,-97.3301,397532|Overland Park,38.9822,-94.6708,197238|Kansas City,39.1155,-94.6268,156607|Olathe,38.8814,-94.8191,141290|Topeka,39.0473,-95.6752,126587|Lawrence,38.9717,-95.2353,94934|Shawnee,39.0417,-94.7203,67311|Manhattan,39.1836,-96.5717,54100|Salina,38.8403,-97.6114,46889|Hutchinson,38.0608,-97.9298,40006|Dodge City,37.7528,-100.0171,27788|Garden City,37.9717,-100.8727,28151|Liberal,37.0431,-100.9210,19825,M|Goodland,39.3506,-101.7107,4489,M',
    KY: 'Louisville,38.2527,-85.7585,633045|Lexington,38.0406,-84.5037,322570|Bowling Green,36.9685,-86.4808,72294,C|Owensboro,37.7719,-87.1112,60183,C|Covington,39.0837,-84.5086,40961|Frankfort,38.2009,-84.8733,28602|Richmond,37.7479,-84.2947,36564|Paducah,37.0834,-88.6000,27137,C|Elizabethtown,37.6939,-85.8591,31394|Berea,37.5687,-84.2963,15539',
    LA: 'New Orleans,29.9511,-90.0715,383997|Baton Rouge,30.4515,-91.1871,227470|Shreveport,32.5252,-93.7502,187593|Lafayette,30.2241,-92.0198,121374|Lake Charles,30.2266,-93.2174,84872|Kenner,29.9941,-90.2417,66448|Bossier City,32.5160,-93.7321,62701|Monroe,32.5093,-92.1193,47702|Alexandria,31.3113,-92.4451,45275|Houma,29.5958,-90.7195,33406|Slidell,30.2752,-89.7812,28781|Natchitoches,31.7607,-93.0863,17994',
    ME: 'Portland,43.6591,-70.2568,68408|Lewiston,44.1004,-70.2148,37121|Bangor,44.8016,-68.7712,31753|South Portland,43.6415,-70.2409,26498|Auburn,44.0979,-70.2311,24061|Augusta,44.3106,-69.7795,18899|Biddeford,43.4926,-70.4534,22552|Brunswick,43.9145,-69.9653,21756|Bar Harbor,44.3876,-68.2039,5089|Camden,44.2098,-69.0648,5232',
    MD: 'Baltimore,39.2904,-76.6122,585708|Columbia,39.2037,-76.8610,104681|Germantown,39.1732,-77.2717,91249|Silver Spring,38.9907,-77.0261,81015|Waldorf,38.6246,-76.9391,81410|Frederick,39.4143,-77.4105,78171|Rockville,39.0840,-77.1528,67117|Gaithersburg,39.1434,-77.2014,69657|Bowie,38.9427,-76.7302,58643|Annapolis,38.9784,-76.4922,40812|Hagerstown,39.6418,-77.7200,43527|Bethesda,38.9847,-77.0947,68056|Salisbury,38.3607,-75.5994,33050|Ocean City,38.3365,-75.0849,6844|Cumberland,39.6529,-78.7625,19075',
    MA: 'Boston,42.3601,-71.0589,675647|Worcester,42.2626,-71.8023,206518|Springfield,42.1015,-72.5898,155929|Cambridge,42.3736,-71.1097,118403|Lowell,42.6334,-71.3162,115554|Brockton,42.0834,-71.0184,105643|Quincy,42.2529,-71.0023,101636|Lynn,42.4668,-70.9495,101253|New Bedford,41.6362,-70.9342,101079|Fall River,41.7015,-71.1550,94000|Newton,42.3370,-71.2092,88923|Somerville,42.3876,-71.0995,81045|Lawrence,42.7070,-71.1631,89143|Framingham,42.2793,-71.4162,72362|Haverhill,42.7762,-71.0773,67787|Waltham,42.3765,-71.2356,65218|Malden,42.4251,-71.0662,66263|Medford,42.4184,-71.1062,59659|Taunton,41.9001,-71.0898,59408|Chicopee,42.1487,-72.6079,55560|Salem,42.5195,-70.8967,44480|Northampton,42.3251,-72.6412,29571|Amherst,42.3732,-72.5199,39263|Plymouth,41.9584,-70.6673,61217|Provincetown,42.0587,-70.1787,3664|Nantucket,41.2835,-70.0995,14255',
    MI: 'Detroit,42.3314,-83.0458,639111|Grand Rapids,42.9634,-85.6681,198917|Warren,42.4775,-83.0277,139387|Sterling Heights,42.5803,-83.0302,134346|Ann Arbor,42.2808,-83.7430,123851|Lansing,42.7325,-84.5555,112644|Flint,43.0125,-83.6875,81252|Dearborn,42.3223,-83.1763,109976|Livonia,42.3684,-83.3527,95535|Troy,42.6064,-83.1498,87294|Westland,42.3242,-83.4002,85420|Farmington Hills,42.4989,-83.3677,83986|Kalamazoo,42.2917,-85.5872,73598|Wyoming,42.9134,-85.7053,76501|Southfield,42.4734,-83.2219,76618|Rochester Hills,42.6584,-83.1499,76300|Saginaw,43.4195,-83.9508,44202|Pontiac,42.6389,-83.2910,61606|Port Huron,42.9709,-82.4249,28983|Traverse City,44.7631,-85.6206,15678|Marquette,46.5436,-87.3954,20629|Holland,42.7875,-86.1089,34378|Midland,43.6156,-84.2472,42547|Battle Creek,42.3212,-85.1797,52731|Escanaba,45.7452,-87.0646,12061,C|Iron Mountain,45.8202,-88.0651,7529,C',
    MN: 'Minneapolis,44.9778,-93.2650,429954|Saint Paul,44.9537,-93.0900,311527|Rochester,44.0121,-92.4802,121395|Duluth,46.7867,-92.1005,86697|Bloomington,44.8408,-93.2983,89987|Brooklyn Park,45.0941,-93.3563,86478|Plymouth,45.0105,-93.4555,81026|Woodbury,44.9239,-92.9594,75102|Maple Grove,45.0725,-93.4558,70253|Saint Cloud,45.5579,-94.1632,68881|Eagan,44.8041,-93.1668,68855|Eden Prairie,44.8547,-93.4708,64198|Mankato,44.1636,-93.9994,44488|Moorhead,46.8738,-96.7678,44505|Winona,44.0499,-91.6393,25948|Bemidji,47.4736,-94.8803,15322',
    MS: 'Jackson,32.2988,-90.1848,153701|Gulfport,30.3674,-89.0928,72926|Southaven,34.9920,-89.9873,55026|Hattiesburg,31.3271,-89.2903,48730|Biloxi,30.3960,-88.8853,49449|Meridian,32.3643,-88.7037,35052|Tupelo,34.2576,-88.7034,37923|Olive Branch,34.9618,-89.8295,39711|Greenville,33.4101,-91.0618,29670|Oxford,34.3665,-89.5192,26400|Starkville,33.4504,-88.8184,25588|Vicksburg,32.3526,-90.8779,21573|Natchez,31.5604,-91.4032,14520',
    MO: 'Kansas City,39.0997,-94.5786,508090|Saint Louis,38.6270,-90.1994,301578|Springfield,37.2090,-93.2923,169176|Columbia,38.9517,-92.3341,126254|Independence,39.0911,-94.4155,123011|Lees Summit,38.9108,-94.3822,101108|OFallon,38.8106,-90.6998,91316|Saint Joseph,39.7675,-94.8467,72473|Saint Charles,38.7881,-90.4974,70493|Blue Springs,39.0169,-94.2816,58765|Joplin,37.0842,-94.5133,51762|Jefferson City,38.5767,-92.1735,43228|Cape Girardeau,37.3059,-89.5181,39540|Branson,36.6437,-93.2185,12638|Rolla,37.9514,-91.7713,19943',
    MT: 'Billings,45.7833,-108.5007,117116|Missoula,46.8721,-113.9940,75516|Great Falls,47.5053,-111.3008,60442|Bozeman,45.6770,-111.0429,53293|Butte,46.0038,-112.5348,34494|Helena,46.5891,-112.0391,32091|Kalispell,48.1958,-114.3129,26224|Havre,48.5500,-109.6841,9362|Whitefish,48.4111,-114.3376,7751|Miles City,46.4083,-105.8406,8354',
    NE: 'Omaha,41.2565,-95.9345,486051|Lincoln,40.8136,-96.7026,291082|Bellevue,41.1544,-95.9146,64176|Grand Island,40.9264,-98.3420,53131|Kearney,40.6994,-99.0817,33790|Fremont,41.4333,-96.4981,27141|Hastings,40.5861,-98.3898,25152|North Platte,41.1239,-100.7654,23390|Scottsbluff,41.8666,-103.6672,14303,M|Chadron,42.8294,-103.0007,5308,M',
    NV: 'Las Vegas,36.1699,-115.1398,641903|Henderson,36.0395,-114.9817,317610|Reno,39.5296,-119.8138,264165|North Las Vegas,36.1989,-115.1175,262527|Sparks,39.5349,-119.7527,108445|Carson City,39.1638,-119.7674,58639|Elko,40.8324,-115.7631,20564|Boulder City,35.9786,-114.8319,14885|Mesquite,36.8055,-114.0672,20471|Pahrump,36.2083,-115.9839,44738',
    NH: 'Manchester,42.9956,-71.4548,115644|Nashua,42.7654,-71.4676,91322|Concord,43.2081,-71.5376,43976|Dover,43.1979,-70.8737,32741|Rochester,43.3045,-70.9756,32492|Keene,42.9337,-72.2781,23047|Portsmouth,43.0718,-70.7626,21956|Hanover,43.7022,-72.2896,11870|Laconia,43.5279,-71.4703,16871|North Conway,44.0537,-71.1284,2349',
    NJ: 'Newark,40.7357,-74.1724,311549|Jersey City,40.7178,-74.0431,292449|Paterson,40.9168,-74.1718,159732|Elizabeth,40.6639,-74.2107,137298|Edison,40.5187,-74.4121,107588|Woodbridge,40.5576,-74.2846,103639|Lakewood,40.0979,-74.2179,135158|Toms River,39.9537,-74.1979,95438|Hamilton,40.2298,-74.6916,92297|Trenton,40.2171,-74.7429,90871|Clifton,40.8584,-74.1638,90296|Camden,39.9259,-75.1196,71791|Brick,40.0578,-74.1093,75072|Cherry Hill,39.9348,-75.0307,74553|Passaic,40.8568,-74.1285,70537|Union City,40.7795,-74.0238,68589|Bayonne,40.6687,-74.1143,71686|Hoboken,40.7440,-74.0324,60419|Atlantic City,39.3643,-74.4229,38497|Princeton,40.3573,-74.6672,31187|New Brunswick,40.4862,-74.4518,55266|Morristown,40.7968,-74.4815,20387|Cape May,38.9351,-74.9060,2768',
    NM: 'Albuquerque,35.0844,-106.6504,564559|Las Cruces,32.3199,-106.7637,111385|Rio Rancho,35.2328,-106.6630,104046|Santa Fe,35.6870,-105.9378,87505|Roswell,33.3943,-104.5230,47601|Farmington,36.7281,-108.2187,46624|Clovis,34.4048,-103.2052,38567|Hobbs,32.7026,-103.1360,40508|Alamogordo,32.8995,-105.9603,31384|Carlsbad,32.4207,-104.2288,32238|Gallup,35.5281,-108.7426,21899|Taos,36.4072,-105.5734,6474|Los Alamos,35.8881,-106.3067,13179',
    NY: 'New York,40.7128,-74.0060,8804190|Brooklyn,40.6782,-73.9442,2736074|Queens,40.7282,-73.7949,2405464|Bronx,40.8448,-73.8648,1472654|Staten Island,40.5795,-74.1502,495747|Manhattan,40.7831,-73.9712,1694251|Buffalo,42.8864,-78.8784,278349|Rochester,43.1566,-77.6088,211328|Yonkers,40.9312,-73.8988,211569|Syracuse,43.0481,-76.1474,148620|Albany,42.6526,-73.7562,99224|New Rochelle,40.9115,-73.7824,79726|Mount Vernon,40.9126,-73.8371,73893|Schenectady,42.8142,-73.9396,67047|Utica,43.1009,-75.2327,65283|White Plains,41.0340,-73.7629,59559|Hempstead,40.7062,-73.6187,59169|Troy,42.7284,-73.6918,51401|Niagara Falls,43.0962,-79.0377,48671|Binghamton,42.0987,-75.9180,47969|Ithaca,42.4440,-76.5019,32108|Poughkeepsie,41.7004,-73.9210,31577|Saratoga Springs,43.0831,-73.7846,28491|Kingston,41.9270,-73.9974,24069|Elmira,42.0898,-76.8077,26523|Long Beach,40.5884,-73.6579,35029|Woodstock,42.0409,-74.1182,5884',
    NC: 'Charlotte,35.2271,-80.8431,874579|Raleigh,35.7796,-78.6382,467665|Greensboro,36.0726,-79.7920,299035|Durham,35.9940,-78.8986,283506|Winston-Salem,36.0999,-80.2442,249545|Fayetteville,35.0527,-78.8784,208501|Cary,35.7915,-78.7811,174721|Wilmington,34.2257,-77.9447,115451|High Point,35.9557,-80.0053,114059|Concord,35.4088,-80.5795,105240|Asheville,35.5951,-82.5515,94589|Greenville,35.6127,-77.3664,87521|Gastonia,35.2621,-81.1873,80411|Jacksonville,34.7541,-77.4302,72723|Chapel Hill,35.9132,-79.0558,61960|Rocky Mount,35.9382,-77.7905,54341|Burlington,36.0957,-79.4378,57303|Wilson,35.7213,-77.9155,47851|Hickory,35.7344,-81.3412,43490|Boone,36.2168,-81.6746,19092|Outer Banks Nags Head,35.9573,-75.6240,3151',
    ND: 'Fargo,46.8772,-96.7898,125990|Bismarck,46.8083,-100.7837,73622|Grand Forks,47.9253,-97.0329,59166|Minot,48.2330,-101.2957,48377|West Fargo,46.8747,-96.9003,38626|Williston,48.1470,-103.6180,29160,M|Dickinson,46.8792,-102.7896,25679,M|Jamestown,46.9105,-98.7084,15849|Medora,46.9147,-103.5241,121,M',
    OH: 'Columbus,39.9612,-82.9988,905748|Cleveland,41.4993,-81.6944,372624|Cincinnati,39.1031,-84.5120,309317|Toledo,41.6528,-83.5379,270871|Akron,41.0814,-81.5190,190469|Dayton,39.7589,-84.1916,137644|Parma,41.4048,-81.7229,81146|Canton,40.7989,-81.3784,70872|Youngstown,41.0998,-80.6495,60068|Lorain,41.4528,-82.1824,65211|Hamilton,39.3995,-84.5613,63399|Springfield,39.9242,-83.8088,58662|Kettering,39.6895,-84.1688,57862|Elyria,41.3683,-82.1076,52656|Lakewood,41.4820,-81.7982,50942|Cuyahoga Falls,41.1339,-81.4846,51114|Athens,39.3292,-82.1013,23849|Oxford,39.5070,-84.7452,23035|Bowling Green,41.3748,-83.6513,30028|Sandusky,41.4489,-82.7080,25793',
    OK: 'Oklahoma City,35.4676,-97.5164,681054|Tulsa,36.1540,-95.9928,413066|Norman,35.2226,-97.4395,128026|Broken Arrow,36.0526,-95.7908,113540|Lawton,34.6036,-98.3959,90381|Edmond,35.6528,-97.4781,94428|Moore,35.3395,-97.4867,62793|Midwest City,35.4495,-97.3967,58409|Stillwater,36.1156,-97.0584,48394|Enid,36.3956,-97.8784,51308|Muskogee,35.7479,-95.3697,36878|Bartlesville,36.7473,-95.9808,37290|Ardmore,34.1743,-97.1436,24689',
    OR: 'Portland,45.5152,-122.6784,652503|Salem,44.9429,-123.0351,175535|Eugene,44.0521,-123.0868,176654|Gresham,45.5001,-122.4302,114247|Hillsboro,45.5229,-122.9898,106447|Beaverton,45.4871,-122.8037,97494|Bend,44.0582,-121.3153,99178|Medford,42.3265,-122.8756,85824|Springfield,44.0462,-123.0220,61672|Corvallis,44.5646,-123.2620,59922|Albany,44.6365,-123.1059,56472|Tigard,45.4312,-122.7715,54539|Ashland,42.1946,-122.7095,21360|Astoria,46.1879,-123.8313,10181|Newport,44.6368,-124.0535,10256|Pendleton,45.6721,-118.7886,16612|Ontario,44.0266,-116.9629,11645,M',
    PA: 'Philadelphia,39.9526,-75.1652,1603797|Pittsburgh,40.4406,-79.9959,302971|Allentown,40.6084,-75.4902,125845|Erie,42.1292,-80.0851,94831|Reading,40.3356,-75.9269,95112|Scranton,41.4090,-75.6624,76328|Bethlehem,40.6259,-75.3705,75781|Lancaster,40.0379,-76.3055,58039|Harrisburg,40.2732,-76.8867,50135|York,39.9626,-76.7277,44800|Altoona,40.5187,-78.3947,43963|State College,40.7934,-77.8600,40501|Wilkes-Barre,41.2459,-75.8813,44328|Chester,39.8496,-75.3557,32605|Williamsport,41.2412,-77.0011,27754|Bethel Park,40.3273,-80.0373,32313|Norristown,40.1215,-75.3399,35748|Easton,40.6884,-75.2207,28127|Gettysburg,39.8309,-77.2311,7106',
    RI: 'Providence,41.8240,-71.4128,190934|Warwick,41.7001,-71.4162,82823|Cranston,41.7798,-71.4373,82934|Pawtucket,41.8787,-71.3826,75604|East Providence,41.8137,-71.3701,47139|Woonsocket,42.0029,-71.5148,43240|Newport,41.4901,-71.3128,25163|Narragansett,41.4501,-71.4495,14532|Block Island,41.1718,-71.5578,1410',
    SC: 'Charleston,32.7765,-79.9311,150227|Columbia,34.0007,-81.0348,136632|North Charleston,32.8546,-79.9748,114852|Mount Pleasant,32.7941,-79.8626,90801|Rock Hill,34.9249,-81.0251,74372|Greenville,34.8526,-82.3940,70720|Summerville,33.0185,-80.1756,50915|Sumter,33.9204,-80.3415,43463|Goose Creek,32.9810,-80.0326,45946|Hilton Head Island,32.2163,-80.7526,37661|Myrtle Beach,33.6891,-78.8867,35682|Spartanburg,34.9496,-81.9320,38732|Florence,34.1954,-79.7626,39899|Clemson,34.6834,-82.8374,17681|Beaufort,32.4316,-80.6698,13607',
    SD: 'Sioux Falls,43.5460,-96.7313,192517|Rapid City,44.0805,-103.2310,74703,M|Aberdeen,45.4647,-98.4865,28495|Brookings,44.3114,-96.7984,23377|Watertown,44.8994,-97.1151,22655|Mitchell,43.7094,-98.0298,15660|Pierre,44.3683,-100.3510,14091|Spearfish,44.4908,-103.8594,12193,M|Deadwood,44.3767,-103.7296,1267,M|Vermillion,42.7794,-96.9292,11695',
    TN: 'Nashville,36.1627,-86.7816,689447|Memphis,35.1495,-90.0490,633104|Knoxville,35.9606,-83.9207,190740,E|Chattanooga,35.0456,-85.3097,181099,E|Clarksville,36.5298,-87.3595,166722|Murfreesboro,35.8456,-86.3903,152769|Franklin,35.9251,-86.8689,83454|Johnson City,36.3134,-82.3535,71046,E|Jackson,35.6145,-88.8139,68205|Hendersonville,36.3048,-86.6200,61753|Kingsport,36.5484,-82.5618,55442,E|Bristol,36.5951,-82.1887,27147,E|Cookeville,36.1628,-85.5016,34842|Gatlinburg,35.7143,-83.5102,3944,E|Oak Ridge,36.0104,-84.2696,31402,E',
    TX: 'Houston,29.7604,-95.3698,2304580|San Antonio,29.4241,-98.4936,1434625|Dallas,32.7767,-96.7970,1304379|Austin,30.2672,-97.7431,961855|Fort Worth,32.7555,-97.3308,918915|El Paso,31.7619,-106.4850,678815,M|Arlington,32.7357,-97.1081,394266|Corpus Christi,27.8006,-97.3964,317863|Plano,33.0198,-96.6989,285494|Laredo,27.5306,-99.4803,255205|Lubbock,33.5779,-101.8552,257141|Garland,32.9126,-96.6389,246018|Irving,32.8140,-96.9489,256684|Amarillo,35.2220,-101.8313,200393|Grand Prairie,32.7459,-96.9978,196100|Brownsville,25.9017,-97.4975,186738|McKinney,33.1972,-96.6398,195308|Frisco,33.1507,-96.8236,200509|Pasadena,29.6911,-95.2091,151950|Killeen,31.1171,-97.7278,153095|McAllen,26.2034,-98.2300,142210|Mesquite,32.7668,-96.5992,150108|Midland,31.9973,-102.0779,132524|Denton,33.2148,-97.1331,139869|Waco,31.5493,-97.1467,138486|Carrollton,32.9537,-96.8903,133434|Round Rock,30.5083,-97.6789,119468|Abilene,32.4487,-99.7331,125182|Odessa,31.8457,-102.3676,114428|Beaumont,30.0802,-94.1266,115282|Richardson,32.9483,-96.7299,119469|College Station,30.6280,-96.3344,120511|Tyler,32.3513,-95.3011,105995|Wichita Falls,33.9137,-98.4934,102316|San Angelo,31.4638,-100.4370,99893|Galveston,29.3013,-94.7977,53219|Lufkin,31.3382,-94.7291,34143|Texarkana,33.4251,-94.0477,36193|Del Rio,29.3627,-100.8968,34673|Marfa,30.3095,-104.0207,1788|South Padre Island,26.1118,-97.1681,2522',
    UT: 'Salt Lake City,40.7608,-111.8910,199723|West Valley City,40.6916,-112.0011,140230|Provo,40.2338,-111.6585,113321|West Jordan,40.6097,-111.9391,116961|Orem,40.2969,-111.6946,98129|Sandy,40.5649,-111.8389,96380|Ogden,41.2230,-111.9738,87321|Saint George,37.0965,-113.5684,95342|Layton,41.0602,-111.9711,81773|Logan,41.7370,-111.8338,52778|Park City,40.6461,-111.4980,8396|Moab,38.5733,-109.5498,5321|Cedar City,37.6775,-113.0619,35235',
    VT: 'Burlington,44.4759,-73.2121,44743|South Burlington,44.4670,-73.1709,20292|Rutland,43.6106,-72.9726,15807|Montpelier,44.2601,-72.5754,8074|Barre,44.1970,-72.5023,8491|Brattleboro,42.8509,-72.5579,12184|Bennington,42.8781,-73.1968,15333|Middlebury,44.0153,-73.1673,9152|Stowe,44.4654,-72.6874,5228',
    VA: 'Virginia Beach,36.8529,-75.9780,459470|Chesapeake,36.7682,-76.2875,249422|Norfolk,36.8508,-76.2859,238005|Arlington,38.8816,-77.0910,238643|Richmond,37.5407,-77.4360,226610|Newport News,37.0871,-76.4730,186247|Alexandria,38.8048,-77.0469,159467|Hampton,37.0299,-76.3452,137148|Roanoke,37.2710,-79.9414,100011|Portsmouth,36.8354,-76.2983,97915|Suffolk,36.7282,-76.5836,94324|Lynchburg,37.4138,-79.1422,79009|Harrisonburg,38.4496,-78.8689,51814|Charlottesville,38.0293,-78.4767,46553|Danville,36.5860,-79.3950,42590|Blacksburg,37.2296,-80.4139,44826|Manassas,38.7509,-77.4753,42772|Fredericksburg,38.3032,-77.4605,27982|Winchester,39.1857,-78.1633,28120|Williamsburg,37.2707,-76.7075,15425|Staunton,38.1496,-79.0717,25750',
    WA: 'Seattle,47.6062,-122.3321,737015|Spokane,47.6588,-117.4260,228989|Tacoma,47.2529,-122.4443,219346|Vancouver,45.6387,-122.6615,190915|Bellevue,47.6101,-122.2015,151854|Kent,47.3809,-122.2348,136588|Everett,47.9790,-122.2021,110629|Renton,47.4829,-122.2171,106785|Spokane Valley,47.6733,-117.2394,102976|Federal Way,47.3223,-122.3126,101030|Yakima,46.6021,-120.5059,96968|Bellingham,48.7519,-122.4787,91482|Kennewick,46.2112,-119.1372,83921|Auburn,47.3073,-122.2285,87256|Olympia,47.0379,-122.9007,55605|Richland,46.2857,-119.2845,60560|Walla Walla,46.0646,-118.3430,34060|Wenatchee,47.4235,-120.3103,35508|Port Angeles,48.1181,-123.4307,19960|Friday Harbor,48.5343,-123.0170,2506',
    WV: 'Charleston,38.3498,-81.6326,48864|Huntington,38.4192,-82.4452,46842|Morgantown,39.6295,-79.9559,30347|Parkersburg,39.2667,-81.5615,29738|Wheeling,40.0640,-80.7209,27062|Martinsburg,39.4562,-77.9639,18777|Fairmont,39.4851,-80.1426,18313|Beckley,37.7782,-81.1882,16240|Clarksburg,39.2806,-80.3445,16061|Harpers Ferry,39.3256,-77.7386,285',
    WI: 'Milwaukee,43.0389,-87.9065,577222|Madison,43.0731,-89.4012,269840|Green Bay,44.5133,-88.0133,107395|Kenosha,42.5847,-87.8212,99986|Racine,42.7261,-87.7829,77816|Appleton,44.2619,-88.4154,75644|Waukesha,43.0117,-88.2315,71158|Eau Claire,44.8113,-91.4985,69421|Oshkosh,44.0247,-88.5426,66816|Janesville,42.6828,-89.0187,65615|La Crosse,43.8014,-91.2396,52680|Sheboygan,43.7508,-87.7145,49929|Wausau,44.9591,-89.6301,39994|Superior,46.7208,-92.1041,26751|Stevens Point,44.5236,-89.5746,25666|Door County Sturgeon Bay,44.8342,-87.3770,9646',
    WY: 'Cheyenne,41.1400,-104.8202,65132|Casper,42.8501,-106.3252,59038|Laramie,41.3114,-105.5911,31407|Gillette,44.2911,-105.5022,33403|Rock Springs,41.5875,-109.2029,23319|Sheridan,44.7972,-106.9562,18737|Jackson,43.4799,-110.7624,10760|Cody,44.5263,-109.0565,10028|Evanston,41.2683,-110.9632,11747|Riverton,43.0247,-108.3801,10682',
    PR: 'San Juan,18.4655,-66.1057,342259|Bayamon,18.3985,-66.1614,185996|Carolina,18.3808,-65.9574,154815|Ponce,18.0111,-66.6141,137491|Caguas,18.2341,-66.0485,127244|Mayaguez,18.2013,-67.1397,73077|Arecibo,18.4725,-66.7156,87754|Aguadilla,18.4274,-67.1541,50265'
  };

  /* Landmark proxies. People born "at Yellowstone" or near one give the park,
     not a city. Coordinates are the main visitor centre / village. */
  var LANDMARKS = [
    ['Yellowstone National Park', 'WY', 44.4280, -110.5885, 'M'],
    ['Grand Canyon Village', 'AZ', 36.0544, -112.1401, 'Z'],
    ['Yosemite Valley', 'CA', 37.7456, -119.5936, 'P'],
    ['Zion National Park', 'UT', 37.2982, -113.0263, 'M'],
    ['Glacier National Park', 'MT', 48.7596, -113.7870, 'M'],
    ['Great Smoky Mountains', 'TN', 35.6118, -83.4895, 'E'],
    ['Rocky Mountain National Park', 'CO', 40.3428, -105.6836, 'M'],
    ['Acadia National Park', 'ME', 44.3386, -68.2733, 'E'],
    ['Everglades National Park', 'FL', 25.2866, -80.8987, 'E'],
    ['Denali National Park', 'AK', 63.1148, -151.1926, 'A'],
    ['Death Valley', 'CA', 36.5054, -117.0794, 'P'],
    ['Mount Rushmore', 'SD', 43.8791, -103.4591, 'M'],
    ['Niagara Falls', 'NY', 43.0962, -79.0377, 'E'],
    ['Sequoia National Park', 'CA', 36.4864, -118.5658, 'P'],
    ['Joshua Tree', 'CA', 33.8734, -115.9010, 'P'],
    ['Badlands National Park', 'SD', 43.8554, -102.3397, 'M'],
    ['Olympic National Park', 'WA', 47.8021, -123.6044, 'P'],
    ['Shenandoah National Park', 'VA', 38.4755, -78.4535, 'E'],
    ['Big Bend National Park', 'TX', 29.1275, -103.2425, 'C'],
    ['Mount Hood', 'OR', 45.3735, -121.6959, 'P']
  ];

  /* Diacritics are folded, not deleted.

     Stripping them turned every accented letter into a space, so "Cordoba"
     typed the way a Spaniard writes it, Córdoba, became "c rdoba" and matched
     Monteria in the Colombian department of Córdoba. München became
     Moenchengladbach. The reader got a confident chart for a city they were
     not born in, with nothing reporting a problem, which is worse than
     returning nothing. Someone should never have to spell their own birthplace
     wrong to be understood.

     NFD splits a letter from its accent so the accent can be dropped; the map
     covers the letters NFD does not decompose.

     This is declared ahead of the rows because the rows' own search keys are
     built with it. They used to be built with a bare toLowerCase, so an
     accented US place could not be found by its unaccented spelling while
     every other row could. */
  var FOLD = { 'ß': 'ss', 'ø': 'o', 'æ': 'ae', 'œ': 'oe',
    'ð': 'd', 'þ': 'th', 'ł': 'l', 'đ': 'd', 'ı': 'i' };
  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[ßøæœðþłđı]/g, function (c) { return FOLD[c] || c; })
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  var ROWS = [];
  function push(name, st, lat, lon, pop, tzc) {
    var code = tzc || STATE_TZ[st] || 'E', tz = TZ[code] || TZ.E;
    ROWS.push({
      name: name, state: st, stateName: STATE_NAME[st] || st, country: 'US',
      lat: lat, lon: lon, pop: pop || 0,
      timezone: tz[0], tzOffset: tz[1], dst: tz[2],
      capital: CAPITALS[st] === name,
      label: name + ', ' + st,
      alias: [],
      key: norm(name + ' ' + st + ' ' + (STATE_NAME[st] || ''))
    });
  }
  Object.keys(DATA).forEach(function (st) {
    DATA[st].split('|').forEach(function (row) {
      var f = row.split(',');
      push(f[0], st, +f[1], +f[2], +f[3], f[4]);
    });
  });
  LANDMARKS.forEach(function (l) { push(l[0], l[1], l[2], l[3], 0, l[4]); });

  /* Every spelling this row answers to: its own name first, then the alternate
     names the world set carries for it. Already folded on the way in. */
  function names(row) {
    var out = [norm(row.name)];
    if (row.alias) for (var i = 0; i < row.alias.length; i++) out.push(row.alias[i]);
    return out;
  }

  /* Ranking for the picker: prefix beats word-start beats substring; population
     and capital status break ties, so "spring" finds Springfield MO before
     Springdale AR.

     Alternate names are matched only whole or from the front. They are not
     added to the row's key, deliberately: the key is what the loose substring
     tiers search, and pouring 141,000 alternate spellings into it would buy a
     handful of finds at the cost of a great many confident near-misses. */
  function score(row, q, parts) {
    var full = row.key, ns = names(row);
    var s = -1;
    for (var i = 0; i < ns.length; i++) {
      var n = ns[i];
      if (!n) continue;
      if (n === q) { s = 1000; break; }
      if (n.indexOf(q) === 0) { s = Math.max(s, 800); continue; }
      if (i === 0 && (' ' + n).indexOf(' ' + q) !== -1) s = Math.max(s, 600);
    }
    if (s < 0) {
      if (full.indexOf(q) !== -1) s = 400;
      else {
        var all = parts.every(function (p) { return full.indexOf(p) !== -1; });
        if (!all) return -1;
        s = 250;
      }
    }
    s += Math.min(120, Math.log10(Math.max(row.pop, 1)) * 20);
    if (row.capital) s += 45;
    return s;
  }

  var G = {
    VERSION: '1.1.0',
    ROWS: ROWS,
    COUNT: ROWS.length,
    COVERAGE: 'curated \u00b7 50 state capitals, major cities, landmark proxies',
    STATE_NAME: STATE_NAME,
    search: function (query, limit) {
      var q = norm(query);
      if (q.length < 2) return [];
      /* "Austin, TX" and "Austin TX" both work. */
      var parts = q.split(' ').filter(Boolean);
      var out = [];
      for (var i = 0; i < ROWS.length; i++) {
        var sc = score(ROWS[i], q, parts);
        if (sc > 0) out.push({ row: ROWS[i], s: sc });
      }
      out.sort(function (a, b) { return b.s - a.s; });
      return out.slice(0, limit || 8).map(function (x) { return x.row; });
    },
    /* lookup answers one question: does this text name a place, well enough to
       write coordinates onto somebody's birth chart without asking them?

       It used to answer a different one. On a miss it took the top search hit,
       and search is a typeahead: its job is to have something to show after
       three letters. So "Zürich" fell through to Lake Zurich, Illinois, and
       "München" to Münchenstein, Switzerland, and geocode stored those as
       resolved. Nothing on screen said a thing. A chart drawn 6,000 km from
       where someone was born, presented with the same confidence as a correct
       one, is the worst thing this file can do.

       So the fallback is gone. A place is committed only when the query names
       it: the whole name, or an alternate spelling of it, optionally followed
       by words that all appear in its region, state or country. "Edison, New
       Jersey" and "Munich, Germany" resolve. "Munchen" resolves through the
       alternate names. Half a name resolves to nothing, and the form says so
       and offers the coordinate fields, which is the honest answer.

       search() is untouched. Partial matches still fill the picker, where a
       person can see what was found and choose it themselves. */
    lookup: function (text) {
      var q = norm(text);
      if (!q) return null;
      var best = null, bestPop = -1;
      for (var i = 0; i < ROWS.length; i++) {
        var r = ROWS[i], ns = names(r), hit = false;
        for (var j = 0; j < ns.length && !hit; j++) {
          var n = ns[j];
          if (!n) continue;
          if (q === n) { hit = true; break; }
          if (q.length > n.length && q.slice(0, n.length + 1) === n + ' ') {
            var rest = q.slice(n.length + 1).split(' ').filter(Boolean);
            hit = rest.every(function (p) { return r.key.indexOf(p) !== -1; });
          }
        }
        /* Several real places share a name. Cordoba is a city in Argentina, one
           in Spain and one in Mexico, and each is somebody's birthplace. Taking
           the largest is a stated default rather than a guess about which the
           reader meant, and the picker lists the rest. */
        if (hit && r.pop > bestPop) { best = r; bestPop = r.pop; }
      }
      return best;
    },
    /* Exposed so callers can fold a query the same way the rows were folded. */
    norm: norm,
    /* Install a fuller dataset later: rows of { name, state, lat, lon, pop, tz }
       where tz is one of E C M P Z A H, or a full IANA string. */
    load: function (rows) {
      if (!Array.isArray(rows) || !rows.length) throw new Error('Gazetteer.load expects a non-empty array');
      ROWS.length = 0;
      rows.forEach(function (r) { push(r.name, r.state, +r.lat, +r.lon, +r.pop || 0, TZ[r.tz] ? r.tz : null); });
      LANDMARKS.forEach(function (l) { push(l[0], l[1], l[2], l[3], 0, l[4]); });
      G.COUNT = ROWS.length;
      G.COVERAGE = 'loaded \u00b7 ' + ROWS.length + ' places';
      return ROWS.length;
    }
  };
  window.Gazetteer = G;
})();
