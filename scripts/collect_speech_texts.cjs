// Inventory of every current speech call, including finite dynamic game phrases.
// Run from the repository root. No account credentials are read or stored.
const fs=require('fs'),ts=require(process.cwd()+'/node_modules/typescript'),vm=require('vm'),crypto=require('crypto');
const items=new Map();
function add(text,group){const key=text.trim().toLocaleLowerCase('es');if(!items.has(key))items.set(key,{id:crypto.createHash('sha256').update(key).digest('hex').slice(0,16),text,group});}
function ast(file){return ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)}
function bank(file,name){let result;function walk(n){if(ts.isVariableDeclaration(n)&&n.name.getText()===name)result=vm.runInNewContext('('+n.initializer.getText()+')');ts.forEachChild(n,walk)}walk(ast(file));return result;}
for(const text of Object.values(bank('src/components/GameSession.tsx','instructions')))add(text,'instructions');
for(const text of ['Taza.','Zapato.','Bien hecho. Puedes continuar con el siguiente ejercicio.'])add(text,'instructions');
for(const dir of ['src/components','src/games'])for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.tsx'))){function walk(n){if(ts.isCallExpression(n)&&n.expression.getText()==='soundService.speak'){const a=n.arguments[0];if(ts.isStringLiteral(a))add(a.text,'feedback');}ts.forEachChild(n,walk)}walk(ast(dir+'/'+f));}
for(const x of bank('src/games/LanguageNamingGame.tsx','VOCABULARY_BANK')){add(x.word,'words');add(x.semanticHint,'hints');add(x.phoneticHint,'hints');add(`Buen intento. El objeto correcto es ${x.word}.`,'feedback');}
for(const x of bank('src/games/WordCompletionGame.tsx','COMPLETION_BANK')){add(x.word,'words');add(x.hint,'hints');add(`¡Correcto! ${x.word}`,'feedback');add(`La letra correcta es la ${x.word[x.missingIndex]}. Formamos ${x.word}.`,'feedback');}
for(const x of bank('src/games/CategorizationGame.tsx','CLASSIFICATION_ITEMS')){add(x.name,'words');add(`¡Correcto! ${x.name} pertenece a ${x.categoryName}.`,'feedback');add(`El objeto ${x.name} corresponde a ${x.categoryName}.`,'feedback');}
for(const x of bank('src/games/MemoryPairsGame.tsx','ALL_MEMORY_OBJECTS'))add(`¡Pareja de ${x.label}!`,'feedback');
for(const x of bank('src/games/VisualScanningGame.tsx','FRUITS_BANK'))add(`Recuerda buscar las ${x.name}.`,'feedback');
for(const t of ['Velocidad de voz pausada y tranquila.','Velocidad de voz normal.','Lee las opciones y responde a tu ritmo.'])add(t,'feedback');
const list=[...items.values()];fs.writeFileSync('public/audio/elevenlabs-v3/texts.json',JSON.stringify(list,null,2));console.log({clips:list.length,characters:list.reduce((n,x)=>n+x.text.length,0)});
