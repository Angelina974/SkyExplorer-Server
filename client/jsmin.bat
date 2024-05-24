call terser kissjs.js --source-map "url=kissjs.min.js.map" --output kissjs.min.js
jsmin.exe <kissjs.css >kissjs.min.css

::
:: COPY THE JS FILE TO KISSJS.NET WEBSITE DIRECTORY
::

set "outputDir=../../../kissjs.net/resources/lib/kissjs"
if not exist "%outputDir%" mkdir "%outputDir%"
copy /Y kissjs.min.js "%outputDir%"
copy /Y kissjs.min.js.map "%outputDir%"