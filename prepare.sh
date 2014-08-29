cd game
rm -f all.js
rm -f js13.zip

# order matters!
echo "(function() {" > all.js
cat ../globals.js >> all.js
cat ../utils.js >> all.js
cat ../gfx_utils.js >> all.js
cat ../particle.js >> all.js
cat ../player.js >> all.js
cat ../sky.js >> all.js
cat ../water.js >> all.js
cat ../level.js >> all.js
cat ../game.js >> all.js

echo "})()" >> all.js

java -jar ~/devel/closure_compiler/compiler.jar --compilation_level ADVANCED  --js all.js   --js_output_file js13.js
rm index.html
cp ../prepared_index.html index.html
zip js13.zip js13.js index.html
\ls -l js13.*

#rm -f all.js
mv js13.zip ..
cp js13.js ..
cd ..
