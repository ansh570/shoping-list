const STORAGE_KEY="homecart-v3";
const $=id=>document.getElementById(id);
let items=JSON.parse(localStorage.getItem(STORAGE_KEY)||localStorage.getItem("homecart-v2")||"null");
if(!items){
  items=[
    {id:1,name:"Milk",qty:"2 litres",category:"Dairy",status:"Running Low",priority:"Important",note:"Buy fresh milk",done:false},
    {id:2,name:"Basmati Rice",qty:"5 kg",category:"Grocery",status:"Finished",priority:"Normal",note:"Kitchen stock is empty",done:false},
    {id:3,name:"Toothpaste",qty:"2 tubes",category:"Personal Care",status:"Finished",priority:"Urgent",note:"Almost finished",done:false},
    {id:4,name:"Apples",qty:"1 kg",category:"Fruits",status:"Running Low",priority:"Normal",note:"Buy fresh ones",done:false},
    {id:5,name:"Dishwashing Liquid",qty:"2 bottles",category:"Household",status:"Running Low",priority:"Important",note:"Kitchen supply",done:false},
    {id:6,name:"Eggs",qty:"12",category:"Dairy",status:"Finished",priority:"Normal",note:"",done:false}
  ];
  save();
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(items))}
function safe(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function parseVoiceText(text){
  let raw=text.trim().replace(/\s+/g," ");
  let name=raw, qty="";

  // Supports: "chini 2 kg", "milk two litres", "soap 4", "चीनी 2 किलो", "दूध 2 लीटर"
  const units=[
    "kg","kgs","kilo","kilos","kilogram","kilograms",
    "g","gram","grams",
    "l","litre","litres","liter","liters",
    "ml","millilitre","millilitres","milliliter","milliliters",
    "pack","packs","packet","packets","box","boxes",
    "bottle","bottles","bag","bags","piece","pieces","pcs",
    "dozen","bar","bars","tube","tubes",
    "किलो","किलोग्राम","ग्राम","लीटर","लिटर","मिलीलीटर","पैकेट","बोतल","बॉक्स","पीस","नग"
  ];
  const unitPattern=units.join("|");
  const numberWords={
    "one":"1","a":"1","an":"1","two":"2","three":"3","four":"4","five":"5",
    "six":"6","seven":"7","eight":"8","nine":"9","ten":"10",
    "एक":"1","दो":"2","तीन":"3","चार":"4","पांच":"5","पाँच":"5","छह":"6","छः":"6",
    "सात":"7","आठ":"8","नौ":"9","दस":"10"
  };
  // Numeric quantity + unit, anywhere near the end.
  let m=raw.match(new RegExp("(\\d+(?:[.,]\\d+)?)\\s*("+unitPattern+")\\b","iu"));
  if(m){
    qty=m[0].replace(",",".");
    name=(raw.slice(0,m.index)+" "+raw.slice(m.index+m[0].length)).replace(/\s+/g," ").trim();
  } else {
    // Number word + unit
    const words=Object.keys(numberWords).join("|");
    m=raw.match(new RegExp("\\b("+words+")\\s+("+unitPattern+")\\b","iu"));
    if(m){
      qty=numberWords[m[1].toLowerCase()]+" "+m[2];
      name=(raw.slice(0,m.index)+" "+raw.slice(m.index+m[0].length)).replace(/\s+/g," ").trim();
    } else {
      // Bare number at the end: "soap 4"
      m=raw.match(/\s(\d+(?:[.,]\d+)?)\s*$/);
      if(m){
        qty=m[1].replace(",",".");
        name=raw.slice(0,m.index).trim();
      } else {
        // Hindi number at the end
        const hindiNum=/\s(एक|दो|तीन|चार|पांच|पाँच|छह|छः|सात|आठ|नौ|दस)\s*$/iu;
        m=raw.match(hindiNum);
        if(m){
          qty=numberWords[m[1]];
          name=raw.slice(0,m.index).trim();
        }
      }
    }
  }

  // Clean common voice-command words from item name.
  name=name.replace(/^(please\s+)?(add|buy|get|need|bring|purchase)\s+/i,"").trim();
  name=name.replace(/\b(please|urgent|urgently|running low|finished|out of)\b/ig,"").replace(/\s+/g," ").trim();
  if(!name) name=raw;
  return {name,qty};
}

function guessCategory(name){
  const n=name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[.,!?;:()[\]{}]/g," ");

  const groups={
    "Dairy":[
      "milk","doodh","dudh","curd","dahi","yogurt","yoghurt","lassi","buttermilk","chaas",
      "paneer","panir","cheese","butter","ghee","cream","malai","khoya","mawa","khoa",
      "ice cream","icecream","flavoured milk","milkshake"
    ],
    "Fruits":[
      "apple","apples","banana","bananas","mango","mangoes","orange","oranges","mosambi",
      "sweet lime","lemon","lemons","lime","grapes","watermelon","melon","muskmelon",
      "papaya","pineapple","pomegranate","anar","guava","amrud","pear","pears","peach",
      "plum","plums","kiwi","strawberry","strawberries","blueberry","blueberries",
      "raspberry","cherry","cherries","coconut","nariyal","avocado","fig","anjeer",
      "dates","khajoor","fruit","fruits","berries"
    ],
    "Vegetables":[
      "vegetable","vegetables","sabzi","sabji","potato","potatoes","aloo","onion","onions",
      "pyaz","tomato","tomatoes","tamatar","carrot","carrots","gajar","cabbage","cauliflower",
      "gobi","broccoli","spinach","palak","peas","matar","beans","french beans","capsicum",
      "shimla mirch","bell pepper","brinjal","baingan","eggplant","ladyfinger","bhindi",
      "okra","cucumber","kheera","lauki","bottle gourd","tori","tinda","pumpkin","kaddu",
      "beetroot","radish","mooli","turnip","sweet corn","corn","mushroom","mushrooms",
      "ginger","adrak","garlic","lahsun","green chilli","chilli","chili","mirch","mint",
      "pudina","coriander","dhaniya","curry leaves","methi","lettuce","zucchini"
    ],
    "Grocery":[
      "rice","chawal","basmati","atta","flour","wheat","gehun","maida","sooji","suji",
      "rava","besan","gram flour","dal","daal","toor dal","arhar dal","moong dal","masoor dal",
      "chana dal","urad dal","rajma","kidney beans","chickpeas","chole","kabuli chana",
      "sugar","chini","cheeni","salt","namak","rock salt","sendha namak","jaggery","gur",
      "oil","cooking oil","mustard oil","sarson oil","sunflower oil","olive oil","coconut oil",
      "tea","chai","coffee","coffee powder","tea bags","spices","masala","turmeric","haldi",
      "cumin","jeera","coriander powder","dhania powder","garam masala","red chilli powder",
      "black pepper","pepper","cardamom","elaichi","clove","laung","cinnamon","dalchini",
      "flour","poha","flattened rice","sabudana","sago","vermicelli","sevai","noodles",
      "pasta","macaroni","bread","toast","bun","rusk","honey","jam","pickle","achar",
      "ketchup","tomato sauce","mayonnaise","vinegar","sauce","cereal","cornflakes",
      "oats","muesli","dry fruits","almonds","badam","cashew","kaju","pistachio","pista",
      "walnut","akhrot","raisins","kishmish","peanuts","moongfali"
    ],
    "Household":[
      "soap","sabon","sabun","handwash","hand wash","dishwash","dish wash","dishwashing",
      "dishwashing liquid","utensil cleaner","vim","detergent","washing powder","laundry",
      "fabric softener","bleach","floor cleaner","toilet cleaner","bathroom cleaner",
      "glass cleaner","surface cleaner","disinfectant","phenyl","harpic","colin",
      "cleaner","broom","jhadu","mop","pocha","dustpan","brush","scrub","sponge",
      "garbage bag","trash bag","dustbin","bucket","mug","cloth","microfiber cloth",
      "tissue","tissues","paper towel","kitchen towel","toilet paper","napkin","napkins",
      "aluminium foil","foil","cling film","plastic wrap","zip lock","storage bag",
      "matchbox","matches","candle","batteries","battery","bulb","led bulb","tube light",
      "extension board","extension cord","plug","adapter","switch","air freshener",
      "room freshener","insect spray","mosquito spray","mosquito repellent","phenyl",
      "shoe polish","shoe brush","hanger","rope","sewing thread","needle"
    ],
    "Personal Care":[
      "toothpaste","tooth paste","toothbrush","tooth brush","mouthwash","floss",
      "shampoo","conditioner","hair oil","hair gel","hair cream","soap","body wash",
      "face wash","facewash","face cream","moisturizer","lotion","sunscreen","sun screen",
      "deodorant","perfume","talcom","talcum","powder","razor","shaving cream","shaving foam",
      "aftershave","comb","hair brush","nail cutter","cotton","cotton buds","ear buds",
      "tissues","wet wipes","wipes","sanitizer","hand sanitizer","lip balm","vaseline",
      "makeup","foundation","lipstick","kajal","conditioner","serum"
    ],
    "Snacks":[
      "biscuit","biscuits","cookie","cookies","chips","namkeen","mixture","bhujia",
      "kurkure","lays","popcorn","chocolate","chocolates","candy","toffee","sweets",
      "mithai","cake","pastry","wafer","wafers","snack","snacks","energy bar","protein bar",
      "ice cream","noodles snack"
    ],
    "Other":[
      "notebook","notebooks","pen","pens","pencil","pencils","eraser","sharpener",
      "marker","markers","paper","printer paper","file","folder","charger","cable",
      "usb cable","phone charger","laptop charger","earphones","headphones","umbrella",
      "torch","flashlight","tool","tools","screwdriver","tape","glue","gift wrap",
      "school bag","bag","wallet","keychain","plant","seeds","pet food","dog food",
      "cat food","medicine box","first aid","other"
    ]
  };

  // Specific categories are checked before broad ones.
  // "Soap" appears in both household and personal care; household wins for generic soap.
  const order=["Dairy","Fruits","Vegetables","Snacks","Personal Care","Household","Grocery","Other"];
  for(const category of order){
    const found=groups[category].some(word=>{
      const w=word.toLowerCase();
      return n.includes(w);
    });
    if(found) return category;
  }
  return "Other";
}
function render(){
  const q=$("search").value.trim().toLowerCase(), filter=$("filter").value;
  let visible=items.filter(x=>(x.name+" "+x.category+" "+x.note).toLowerCase().includes(q));
  if(filter==="pending") visible=visible.filter(x=>!x.done);
  if(filter==="done") visible=visible.filter(x=>x.done);
  if(filter==="low") visible=visible.filter(x=>x.status==="Running Low"&&!x.done);
  if(filter==="urgent") visible=visible.filter(x=>x.priority==="Urgent"&&!x.done);
  $("shoppingList").innerHTML=visible.length?visible.map(x=>{
    const badge=x.done?"Purchased":x.priority==="Urgent"?"Urgent":x.status;
    const cls=x.done?"done":x.priority==="Urgent"?"urgent":x.status==="Running Low"?"low":"";
    return `<div class="item ${x.done?"completed":""}">
      <input class="check" type="checkbox" ${x.done?"checked":""} aria-label="Mark ${safe(x.name)} purchased" onchange="toggleItem(${x.id})">
      <div class="item-info"><b>${safe(x.name)}</b><div class="meta">${safe(x.qty||"")} · ${safe(x.category)}${x.note?" · "+safe(x.note):""}</div></div>
      <span class="badge ${cls}">${safe(badge)}</span>
      <button class="delete" onclick="deleteItem(${x.id})">Delete</button>
    </div>`;
  }).join(""):`<div class="empty">🎉 Nothing here right now.<br>Add something you need to buy.</div>`;
  $("totalCount").textContent=items.filter(x=>!x.done).length;
  $("lowCount").textContent=items.filter(x=>x.status==="Running Low"&&!x.done).length;
  $("urgentCount").textContent=items.filter(x=>x.priority==="Urgent"&&!x.done).length;
  $("doneCount").textContent=items.filter(x=>x.done).length;
  const pending=items.filter(x=>!x.done);
  $("shoppingModeList").innerHTML=pending.length?pending.map(x=>`<label class="shopping-check"><input type="checkbox" onchange="toggleItem(${x.id})"><span>${safe(x.name)}${x.qty?" — "+safe(x.qty):""}</span></label>`).join(""):`<div class="empty">🎉 Shopping complete!</div>`;
}
window.toggleItem=id=>{const x=items.find(i=>i.id===id);if(x){x.done=!x.done;save();render()}};
window.deleteItem=id=>{items=items.filter(i=>i.id!==id);save();render()};
$("itemForm").addEventListener("submit",e=>{
  e.preventDefault();
  const name=$("itemName").value.trim();
  if(!name)return;
  items.unshift({id:Date.now(),name,qty:$("quantity").value.trim(),category:$("category").value,status:$("status").value,priority:$("priority").value,note:$("note").value.trim(),done:false});
  save();e.target.reset();render();document.querySelector("#list").scrollIntoView({behavior:"smooth"});
});
document.querySelectorAll("[data-quick]").forEach(btn=>btn.addEventListener("click",()=>{
  $("itemName").value=btn.dataset.quick;
  $("itemName").focus();
  document.querySelector("#add").scrollIntoView({behavior:"smooth",block:"center"});
}));
$("search").addEventListener("input",render);$("filter").addEventListener("change",render);
$("clearDone").addEventListener("click",()=>{items=items.filter(x=>!x.done);save();render()});

function startVoice(){
  // Android APK bridge: native speech recognition returns the transcript to window.androidVoiceResult().
  if(window.AndroidVoice && typeof window.AndroidVoice.startVoice === "function"){
    $("voiceStatus").textContent='Listening... speak your item and quantity.';
    window.AndroidVoice.startVoice();
    return;
  }
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){
    $("voiceStatus").textContent="Voice input is not supported in this browser. Try Google Chrome.";
    return;
  }
  if(window.currentRecognition){window.currentRecognition.stop();return}
  const r=new SR();
  window.currentRecognition=r;
  r.lang="en-IN";r.interimResults=false;r.maxAlternatives=1;
  $("micBtn").classList.add("listening");$("micText").textContent="Listening...";
  $("voiceStatus").textContent='Try: "chini 2 kg", "milk two litres", or "soap 4".';
  r.onresult=e=>{
    const text=e.results[0][0].transcript.trim();
    const parsed=parseVoiceText(text);
    $("itemName").value=parsed.name;
    if(parsed.qty) $("quantity").value=parsed.qty;
    const guessed=guessCategory(parsed.name);
    $("category").value=guessed;
    if(/\b(urgent|urgently)\b/i.test(text)) $("priority").value="Urgent";
    if(/\b(running low|low)\b/i.test(text)) $("status").value="Running Low";
    $("voiceStatus").textContent=parsed.qty
      ? `Heard "${text}" → Item: ${parsed.name} · Quantity: ${parsed.qty}`
      : `Heard "${text}" → Item detected. No quantity found.`;
  };
  r.onerror=()=>{$("voiceStatus").textContent="I couldn't hear that. Please try again."};
  r.onend=()=>{window.currentRecognition=null;$("micBtn").classList.remove("listening");$("micText").textContent="Add by Mic"};
  r.start();
}
$("micBtn").addEventListener("click",startVoice);
$("heroMicBtn").addEventListener("click",()=>{$("add").scrollIntoView({behavior:"smooth"});setTimeout(startVoice,350)});
window.androidVoiceResult=function(text){
  const parsed=parseVoiceText(text);
  $("itemName").value=parsed.name;
  if(parsed.qty) $("quantity").value=parsed.qty;
  $("category").value=guessCategory(parsed.name);
  if(/\\b(urgent|urgently)\\b/i.test(text)) $("priority").value="Urgent";
  if(/\\b(running low|low)\\b/i.test(text)) $("status").value="Running Low";
  $("voiceStatus").textContent=parsed.qty
    ? `Heard "${text}" → Item: ${parsed.name} · Quantity: ${parsed.qty}`
    : `Heard "${text}" → Item: ${parsed.name}. No quantity found.`;
};

function createPDF(){
  // On Android, use the native Print framework so "Save as PDF" works reliably.
  // In a normal browser, keep the existing browser print behaviour.
  const originalTitle=document.title;
  document.title="HomeCart Shopping List";
  if(window.AndroidPrint && typeof window.AndroidPrint.print === "function") {
    window.AndroidPrint.print();
  } else {
    window.print();
  }
  setTimeout(()=>document.title=originalTitle,1000);
}
const pdfBtn=document.getElementById("pdfBtn");
if(pdfBtn) pdfBtn.addEventListener("click",createPDF);

$("themeBtn").addEventListener("click",()=>{document.body.classList.toggle("dark");$("themeBtn").textContent=document.body.classList.contains("dark")?"☀️":"🌙";localStorage.setItem("homecart-dark",document.body.classList.contains("dark"))});
if(localStorage.getItem("homecart-dark")==="true"){document.body.classList.add("dark");$("themeBtn").textContent="☀️"}
render();