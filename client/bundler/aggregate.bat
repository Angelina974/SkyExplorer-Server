::
:: GENERATE THE KISSJS BUNDLE
::

:: DELETE EXISTING OUTPUT FILES
del /Q "..\kissjs.js"
del /Q "..\kissjs.css"

:: GENERATE THE JAVASCRIPT BUNDLE
type "..\core\kiss.js" >> "..\kissjs.js"
for /R "..\core\db" %%f in (*.js) do type "%%f" >> "..\kissjs.js"
for /R "..\core\modules" %%f in (*.js) do type "%%f" >> "..\kissjs.js"
for /R "..\ui" %%f in (*.js) do type "%%f" >> "..\kissjs.js"
for %%f in ("..\..\common\*.js") do type "%%f" >> "..\kissjs.js"

:: GENERATE THE CSS BUNDLE
type "..\ui\styles\base.css" >> "..\kissjs.css"
type "..\ui\styles\animations\animate.css" >> "..\kissjs.css"
for /R "..\ui\abstract" %%f in (*.css) do type "%%f" >> "..\kissjs.css"
for /R "..\ui\containers" %%f in (*.css) do type "%%f" >> "..\kissjs.css"
for /R "..\ui\data" %%f in (*.css) do type "%%f" >> "..\kissjs.css"
for /R "..\ui\elements" %%f in (*.css) do type "%%f" >> "..\kissjs.css"
for /R "..\ui\fields" %%f in (*.css) do type "%%f" >> "..\kissjs.css"
for /R "..\ui\form" %%f in (*.css) do type "%%f" >> "..\kissjs.css"
for /R "..\ui\helpers" %%f in (*.css) do type "%%f" >> "..\kissjs.css"
for /R "..\ui\views" %%f in (*.css) do type "%%f" >> "..\kissjs.css"

::
:: GENERATE THE EXTENSION BUNDLES
::

:: LINK
type "..\ux\link\link.js" >> "..\kissjs.js"
type "..\ux\link\link.css" >> "..\kissjs.css"

:: DIRECTORY
type "..\ux\directory\directory.js" >> "..\kissjs.js"
type "..\ux\directory\directory.css" >> "..\kissjs.css"

:: SELECT VIEW COLUMN
type "..\ux\selectViewColumn\selectViewColumn.js" >> "..\kissjs.js"

:: SELECT VIEW COLUMNS
type "..\ux\selectViewColumns\selectViewColumns.js" >> "..\kissjs.js"

:: CODE EDITOR
type "..\ux\codeEditor\codeEditor.js" >> "..\kissjs.js"
type "..\ux\codeEditor\codeEditor.css" >> "..\kissjs.css"

:: AI TEXTAREA
type "..\ux\aiTextarea\aiTextarea.js" >> "..\kissjs.js"

:: AI IMAGE
type "..\ux\aiImage\aiImage.js" >> "..\kissjs.js"

:: WIZARD PANEL
type "..\ux\wizardPanel\wizardPanel.js" >> "..\kissjs.js"

::
:: COPY THE CSS FILES TO KISSJS.NET WEBSITE DIRECTORY
::

set "outputDir=../../../../kissjs.net/resources/lib/kissjs"
if not exist "%outputDir%" mkdir "%outputDir%"
copy /Y "..\kissjs.css" "%outputDir%"

copy /Y "..\ui\styles\base.css" "../../../../kissjs.net/resources/lib/kissjs/styles"
copy /Y "..\ui\styles\colors\dark.css" "../../../../kissjs.net/resources/lib/kissjs/styles/colors"
copy /Y "..\ui\styles\colors\light.css" "../../../../kissjs.net/resources/lib/kissjs/styles/colors"
copy /Y "..\ui\styles\geometry\default.css" "../../../../kissjs.net/resources/lib/kissjs/styles/geometry"
copy /Y "..\ui\styles\geometry\round.css" "../../../../kissjs.net/resources/lib/kissjs/styles/geometry"
copy /Y "..\ui\styles\geometry\sharp.css" "../../../../kissjs.net/resources/lib/kissjs/styles/geometry"
copy /Y "..\ui\styles\geometry\mobile.css" "../../../../kissjs.net/resources/lib/kissjs/styles/geometry"