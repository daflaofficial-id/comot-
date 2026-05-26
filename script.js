/* =========================================
   COMOT STORE
   Premium Marketplace Script
   localStorage + posting + kategori
========================================= */


/*
Contoh struktur data:

[
{
id:"abc123",
owner:"device_xxx",
nama:"Poster FF",
deskripsi:"Poster premium",
harga:"5000",
kategori:"Poster",
kontak:"@user",
status:"Terlaris",
foto:["base64","base64"],
rating:5,
ratingTotal:10,
ratingUser:2,
ulasan:3
}
]
*/


/* ====================
DEVICE ID
==================== */

let deviceId =
localStorage.getItem(
"comotDevice"
)

if(!deviceId){

deviceId=
"device_"+
Math.random()
.toString(36)
.substring(2)

localStorage.setItem(
"comotDevice",
deviceId
)

}



/* ====================
DATABASE
==================== */

let produk=

JSON.parse(

localStorage.getItem(
"produkComot"
)

)||[]



/* ====================
LOADING
==================== */

window.onload=()=>{

setTimeout(()=>{

let load=
document.getElementById(
"loading"
)

if(load){

load.style.opacity=0

setTimeout(()=>{

load.remove()

},1000)

}

render()

buatKategori()

},1800)

}



/* ====================
MODAL
==================== */

function openModal(){

document
.getElementById(
"modal"
)

.style.display=
"flex"

}


function closeModal(){

document
.getElementById(
"modal"
)

.style.display=
"none"

}




window.onclick=(e)=>{

let modal=
document
.getElementById(
"modal"
)

if(e.target===modal){

closeModal()

}

}




/* ====================
TAMBAH PRODUK
==================== */

function tambahProduk(){

let files=

document
.getElementById(
"foto"
).files


if(files.length>6){

alert(
"Maksimal 6 foto"
)

return

}



let foto=[]


if(files.length==0){

simpanProduk([])

return

}


for(let i=0;i<
files.length;i++){

let reader=
new FileReader()

reader.onload=
e=>{

foto.push(
e.target.result
)

if(
foto.length==
files.length
){

simpanProduk(
foto
)

}

}

reader.readAsDataURL(
files[i]
)

}


}




function simpanProduk(
foto
){

let data={

id:
Date.now()+

Math.random(),

owner:
deviceId,

nama:
nama.value,

deskripsi:
deskripsi.value,

harga:
harga.value,

kategori:
kategori.value
||"Lainnya",

kontak:
kontak.value,

status:
status.value,

foto:
foto,

rating:0,

ratingTotal:0,

ratingUser:0,

ulasan:0

}



produk.push(data)



localStorage.setItem(

"produkComot",

JSON.stringify(
produk
)

)



closeModal()

render()

buatKategori()



alert(
"Produk berhasil diposting"
)


}




/* ====================
RENDER PRODUK
==================== */

function render(){

let box=

document
.getElementById(
"produk"
)



if(!box)return



box.innerHTML=""


if(
produk.length==0
){

box.innerHTML=`

<div class="empty">

Belum ada produk

</div>

`

return

}



produk.forEach((x)=>{


let label=""


if(
x.status
=="Terlaris"
){

label=
`<div class='badge'>
🔥 Produk Terlaris
</div>`

}


if(
x.status
=="Terbaik"
){

label=
`<div class='badge'>
⭐ Produk Terbaik
</div>`

}


if(
x.status
=="Produk Baru"
){

label=
`<div class='badge'>
🆕 Produk Baru
</div>`

}




box.innerHTML+=`

<div class="card">

${label}


<img src="${
x.foto[0]
||
'logo.png'
}">


<div class="cardContent">


<h3>

${x.nama}

</h3>


<p>

${x.deskripsi
.substring(0,70)}

...

</p>


<div class="price">

Rp ${x.harga}

</div>



<div class="rating">

★★★★★

(${x.rating.toFixed(1)})

${x.ulasan}
ulasan

</div>


<div class="buttonGroup">


<button
class="btn"

onclick=
"detail('${x.id}')">

Lihat Detail

</button>



<button
class="btn"

onclick=
"beli(

'${x.nama}',

'${x.harga}'

)">

Beli

</button>


</div>


${
x.owner===deviceId

?

`<br>

<button
class='btn'

onclick=
hapusProduk(

'${x.id}'

)

>

Hapus

</button>`

:

""

}


</div>

</div>

`

})

}





/* ====================
DETAIL
==================== */

function detail(id){

let x=

produk.find(

a=>a.id==id

)



if(!x)return



let slider=""


x.foto.forEach(g=>{

slider+=

`

<img
src="${g}"

class=
"detailImage"

>

`

})



document.body
.insertAdjacentHTML(

"beforeend",

`

<div
class="modal"
id="detailModal"

style=
"display:flex"

>

<div
class="modalContent">

<div
class="close"

onclick=
"tutupDetail()"

>

✕

</div>


<h2
class=
"detailTitle"

>

${x.nama}

</h2>


<div
class="slider">

${slider}

</div>


<p>

${x.deskripsi}

</p>


<div
class=
"detailPrice"

>

Rp ${x.harga}

</div>


<p>

Kategori:

${x.kategori}

</p>


<p>

Kontak:

${x.kontak}

</p>


<div
class=
"rating"

>

★★★★★
${x.rating}

</div>


<button
class="btn"

onclick=
beriRating(

'${x.id}'

)

>

Beri Rating

</button>


<button
class="btn"

onclick=
beli(

'${x.nama}',

'${x.harga}'

)

>

Beli

</button>


</div>

</div>

`

)

}



/* ====================
TUTUP DETAIL
==================== */

function tutupDetail(){

let x=

document
.getElementById(
"detailModal"
)

if(x){

x.remove()

}

}




/* ====================
RATING
1 DEVICE 1 RATING
==================== */

function beriRating(
id
){

let key=

"rating_"

+id+

deviceId


if(
localStorage
.getItem(key)
){

alert(
"Kamu sudah memberi rating"
)

return

}



let nilai=

prompt(
"Rating 1-5"
)


if(
!nilai
)return


nilai=
parseInt(
nilai
)



if(
nilai<1
||
nilai>5
){

alert(
"Rating harus 1-5"
)

return

}



let x=

produk.find(
a=>a.id==id
)



x.ratingTotal+=
nilai


x.ratingUser+=1


x.ulasan+=1


x.rating=

x.ratingTotal

/

x.ratingUser



localStorage.setItem(

key,

true

)


localStorage.setItem(

"produkComot",

JSON.stringify(
produk
)

)



render()

tutupDetail()


}





/* ====================
HAPUS
==================== */

function hapusProduk(
id
){

if(

!confirm(
"Hapus produk?"
)

)return



produk=

produk.filter(

x=>

!(

x.id==id

&&

x.owner===deviceId

)

)



localStorage.setItem(

"produkComot",

JSON.stringify(
produk
)

)


render()

buatKategori()

}




/* ====================
BELI
==================== */

function beli(
nama,
harga
){

let pesan=

`Halo, saya ingin membeli ${nama}

Harga: ${harga}

Apakah produk masih tersedia?`


window.open(

"https://t.me/Bababaaba07?text="+

encodeURIComponent(
pesan
)

)

}




/* ====================
SEARCH REALTIME
==================== */

let search=

document
.getElementById(
"search"
)


if(search){

search.oninput=()=>{

let key=

search.value
.toLowerCase()


document
.querySelectorAll(
".card"
)

.forEach(card=>{

card.style.display=

card.innerText
.toLowerCase()
.includes(key)

?

"block"

:

"none"

})

}

}




/* ====================
KATEGORI OTOMATIS
==================== */

function buatKategori(){


let area=

document
.getElementById(
"kategoriContainer"
)


if(!area)return


let awal=[

"Poster",

"Script",

"Ebook",

"Lainnya"

]


produk.forEach(x=>{

if(

!awal.includes(
x.kategori
)

){

awal.push(
x.kategori
)

}

})



area.innerHTML=""


awal.forEach(k=>{

area.innerHTML+=`

<button
class=
"kategoriBtn"

onclick=
filterKategori(
'${k}'
)

>

${k}

</button>

`

})

}




function filterKategori(
nama
){

document
.querySelectorAll(
".card"
)

.forEach(card=>{

card.style.display=

card.innerText
.includes(nama)

?

"block"

:

"none"

})

}
