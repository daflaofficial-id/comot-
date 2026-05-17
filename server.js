const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;
const ADMIN_ID = String(process.env.ADMIN_ID);

const bot = new TelegramBot(BOT_TOKEN);

mongoose.connect(MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(console.error);

/* ================= DATABASE ================= */

const Product = mongoose.model("products", new mongoose.Schema({
  name:String,
  price:Number,
  desc:String,
  fileId:String
}));

const Payment = mongoose.model("payments", new mongoose.Schema({
  method:String, // QRIS / DANA / SHOPEE
  photo:String,
  description:String
}));

const Buyer = mongoose.model("buyers",new mongoose.Schema({
  chatId:{
    type:String,
    unique:true
  }
}));

const Order = mongoose.model("orders",new mongoose.Schema({
  _id:String, // chat id pembeli
  chatId:String,
  productId:String,
  status:{
    type:String,
    default:"pending"
  }
}));

/* ================= MEMORY ================= */

const waiting = {};

/* ================= WEBHOOK ================= */

app.post("/webhook",(req,res)=>{
 bot.processUpdate(req.body);
 res.sendStatus(200);
});

/* ================= START ================= */

bot.onText(/\/start/,async(msg)=>{

let id=String(msg.chat.id)

let keyboard=[]

if(id===ADMIN_ID){

keyboard=[
[{text:"📦 Lihat Produk"}],
[{text:"➕ Tambah Produk"}],
[{text:"📢 Iklan"}],
[{text:"💳 Pembayaran"}],
[{text:"✏️ Edit Pembayaran"}],
[{text:"🗑 Hapus Pembayaran"}]
]

}else{

keyboard=[
[{text:"📦 Lihat Produk"}],
[{text:"👤 Hubungi Admin"},{text:"❓ Bantuan"}]
]

}

bot.sendMessage(
id,
"Selamat datang 👋",
{
reply_markup:{
keyboard,
resize_keyboard:true
}
}
)

})

/* ================= MESSAGE ================= */

bot.on("message",async(msg)=>{

const id=String(msg.chat.id)
const text=msg.text||""

/* bukti wajib foto */

if(waiting[id]?.buy && !msg.photo){

return bot.sendMessage(
id,
"❌ Bukti pembayaran wajib foto"
)

}

/* menu */

if(text==="👤 Hubungi Admin"){

return bot.sendMessage(
id,
"Hubungi admin"
)

}

if(text==="❓ Bantuan"){

return bot.sendMessage(
id,
"Pilih produk lalu beli"
)

}

/* tambah produk */

if(
text==="➕ Tambah Produk" &&
id===ADMIN_ID
){

waiting[id]="product_name"

return bot.sendMessage(
id,
"Kirim nama produk"
)

}

if(waiting[id]==="product_name"){

if(!text.trim())
return bot.sendMessage(
id,
"Nama kosong"
)

waiting[id]={
step:"price",
name:text
}

return bot.sendMessage(
id,
"Kirim harga"
)

}

if(waiting[id]?.step==="price"){

if(isNaN(text))
return bot.sendMessage(
id,
"Harga harus angka"
)

waiting[id].price=text
waiting[id].step="desc"

return bot.sendMessage(
id,
"Kirim deskripsi"
)

}

if(waiting[id]?.step==="desc"){

waiting[id].desc=text
waiting[id].step="file"

return bot.sendMessage(
id,
"Upload file produk/video"
)

}

/* admin upload file */

if(
waiting[id]?.step==="file" &&
msg.document
){

await Product.create({

name:waiting[id].name,
price:waiting[id].price,
desc:waiting[id].desc,
fileId:msg.document.file_id

})

delete waiting[id]

return bot.sendMessage(
id,
"✅ Produk ditambahkan"
)

}

/* lihat produk */

if(text==="📦 Lihat Produk"){

let products=
await Product.find()

if(products.length<1){

return bot.sendMessage(
id,
"Produk kosong"
)

}

for(let p of products){

bot.sendMessage(

id,

`📦 ${p.name}

💰 Rp${p.price}

📝 ${p.desc}`,

{
reply_markup:{
inline_keyboard:[
[
{
text:"Beli",
callback_data:"buy_"+p._id
}
]
]
}
}

)

}

}

/* tambah pembayaran */

if(
text==="💳 Pembayaran" &&
id===ADMIN_ID
){

return bot.sendMessage(
id,
"Pilih metode",
{
reply_markup:{
inline_keyboard:[
[
{text:"QRIS",callback_data:"pay_QRIS"}
],
[
{text:"DANA",callback_data:"pay_DANA"}
],
[
{text:"ShopeePay",callback_data:"pay_SHOPEE"}
]
]
}
}
)

}

/* edit */

if(
text==="✏️ Edit Pembayaran" &&
id===ADMIN_ID
){

return bot.sendMessage(
id,
"Pilih metode",
{
reply_markup:{
inline_keyboard:[
[
{text:"QRIS",callback_data:"edit_QRIS"}
],
[
{text:"DANA",callback_data:"edit_DANA"}
],
[
{text:"ShopeePay",callback_data:"edit_SHOPEE"}
]
]
}
}
)

}

/* hapus */

if(
text==="🗑 Hapus Pembayaran" &&
id===ADMIN_ID
){

return bot.sendMessage(
id,
"Pilih metode",
{
reply_markup:{
inline_keyboard:[
[
{text:"QRIS",callback_data:"del_QRIS"}
],
[
{text:"DANA",callback_data:"del_DANA"}
],
[
{text:"ShopeePay",callback_data:"del_SHOPEE"}
]
]
}
}
)

}

/* deskripsi pembayaran */

if(
waiting[id]?.step==="payment_desc"
){

await Payment.deleteMany({
method:waiting[id].method
})

await Payment.create({

method:
waiting[id].method,

photo:
waiting[id].photo,

description:text

})

delete waiting[id]

return bot.sendMessage(
id,
"✅ Disimpan"
)

}

})

/* ================= PHOTO ================= */

bot.on("photo",async(msg)=>{

const id=
String(msg.chat.id)

if(
waiting[id]?.step==="payment_photo"
){

waiting[id]={

step:"payment_desc",

method:
waiting[id].method,

photo:
msg.photo.at(-1).file_id

}

return bot.sendMessage(
id,
"Kirim deskripsi"
)

}

/* bukti pembayaran */

if(waiting[id]?.buy){

let order=
await Order.create({

_id:id,
chatId:id,
productId:
waiting[id].buy

})

/* kirim foto ke admin */

await bot.sendPhoto(

ADMIN_ID,

msg.photo.at(-1).file_id,

{
caption:
`Bukti pembayaran

ID:${id}`
}

)

await bot.sendMessage(

ADMIN_ID,

"ACC pembelian?",

{
reply_markup:{
inline_keyboard:[
[
{
text:"✅ ACC",
callback_data:
"acc_"+order._id
}
]
]
}
}

)

delete waiting[id]

return bot.sendMessage(
id,
"Menunggu ACC admin"
)

}

})

/* ================= CALLBACK ================= */

bot.on(
"callback_query",
async(q)=>{

let id=
String(
q.message.chat.id
)

let data=q.data

/* beli */

if(
data.startsWith("buy_")
){

waiting[id]={

buy:
data.split("_")[1]

}

let pay=
await Payment.find()

let rows=[]

for(let p of pay){

rows.push([{
text:p.method,
callback_data:
"show_"+p.method
}])

}

return bot.sendMessage(

id,

"Pilih pembayaran",

{
reply_markup:{
inline_keyboard:rows
}
}

)

}

/* tampil pembayaran */

if(
data.startsWith(
"show_"
)
){

let method=
data.split("_")[1]

let pay=
await Payment.findOne({
method
})

if(!pay){

return bot.answerCallbackQuery(
q.id,
{
text:
"Belum tersedia"
}
)

}

await bot.sendPhoto(

id,

pay.photo,

{
caption:
pay.description
}

)

return bot.sendMessage(
id,
"Kirim bukti pembayaran"
)

}

/* set pembayaran */

if(
data.startsWith("pay_")
){

let method=
data.split("_")[1]

waiting[id]={

step:
"payment_photo",

method

}

return bot.sendMessage(
id,
"Kirim foto pembayaran"
)

}

/* edit */

if(
data.startsWith(
"edit_"
)
){

let method=
data.split("_")[1]

waiting[id]={

step:
"payment_photo",

method

}

return bot.sendMessage(
id,
"Kirim foto baru"
)

}

/* hapus */

if(
data.startsWith(
"del_"
)
){

let method=
data.split("_")[1]

await Payment.deleteMany({
method
})

return bot.sendMessage(
id,
"Terhapus"
)

}

/* acc */

if(
data.startsWith(
"acc_"
) &&
id===ADMIN_ID
){

let cid=
data.split("_")[1]

let order=
await Order.findById(
cid
)

if(!order)
return

let product=
await Product.findById(
order.productId
)

if(!product)
return

await bot.sendDocument(
order.chatId,
product.fileId
)

let cek=
await Buyer.findOne({
chatId:
order.chatId
})

if(!cek){

await Buyer.create({
chatId:
order.chatId
})

}

await Order.deleteOne({
_id:cid
})

bot.sendMessage(
ADMIN_ID,
"✅ Selesai"
)

}

})

/* ================= SERVER ================= */

app.listen(
process.env.PORT||8080,
()=>{

console.log(
"Bot Running"
)

}
)