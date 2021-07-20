const Jimp = require("jimp");
const crypto = require("crypto");

const fontE = Jimp.FONT_SANS_64_BLACK;
const captchaChars = "24569adfkmpqrswxz";
const imageW = 360;
const imageH = 120;
const rotateMax = 10;

const mapNumber=(v,x1,y1,x2,y2)=>((v-x1)/(y1-x1))*(y2-x2)+x2;
const drawLine=(image,x1,y1,x2,y2,color)=>{
	image.setPixelColor(color,x1,y1);
	image.setPixelColor(color,x2,y2);
	var ex=x2-x1;
	var ey=y2-y1;
	var cx=0;
	var cy=0;
	var mg=Math.sqrt(ex*ex+ey*ey);
	var dx=ex/mg;
	var dy=ey/mg;
	for(var i=0;i<Math.floor(mg);i++){
		cx+=dx;
		cy+=dy;
		image.setPixelColor(color,cx+x1,cy+y1);
	}
};

module.exports = async () => {
	var captchaValue = new Array(crypto.randomInt(6,9)).fill(0)
		.map(e=>captchaChars[crypto.randomInt(0, captchaChars.length)])
		.join("");
	var image = new Jimp(imageW, imageH, 0xffffffff);
	image.background(0xffffffff);
	var font = await Jimp.loadFont(fontE);
	var fontW = Jimp.measureText(font, captchaValue);
	var fontH = Jimp.measureTextHeight(font, captchaValue, fontW);
	const line = () => { drawLine(image, crypto.randomInt(0,Math.ceil(imageW/3)),crypto.randomInt(0,imageH), crypto.randomInt(Math.floor(imageW/3*2),imageW),crypto.randomInt(0,imageH), 0xff); };
	image.print(font, (imageW-fontW)/2, (imageH-fontH)/2, captchaValue);
	image.rotate(crypto.randomInt(-rotateMax,rotateMax+1),false);
	image.scan(0,0,image.bitmap.width,image.bitmap.height,(x,y,id)=>{
		if (crypto.randomInt(0,2048)==0) {
			image.scan(x-2,y-2,5,5,(tx,ty,tid)=>{
				image.setPixelColor(0xff,tx,ty);
			});
		} else if (crypto.randomInt(0,2048)<2) {
			image.scan(x-1,y-1,3,3,(tx,ty,tid)=>{
				image.setPixelColor(0xff,tx,ty);
			});
		} else if (crypto.randomInt(0,2048)<4) image.setPixelColor(0xff,x,y);
	});
	line();
	image.rotate(crypto.randomInt(-rotateMax,rotateMax+1),false);
	image.blur(1);
	image.posterize(1);
	for (var i = 0; i < 10; i++) line();
	image.scan(0,0,image.bitmap.width,image.bitmap.height,(x,y,id)=>{
		var c = Jimp.intToRGBA(image.getPixelColor(x,y));
		c.r = mapNumber(c.r, 0, 255, 0xff, 0x12);
		c.g = mapNumber(c.g, 0, 255, 0xff, 0x12);
		c.b = mapNumber(c.b, 0, 255, 0xff, 0x16);
		image.setPixelColor(Jimp.rgbaToInt(c.r,c.g,c.b,c.a),x,y);
	});
	var imageBuf = await image.getBufferAsync(Jimp.MIME_PNG);
	return { jimp: image, image: imageBuf, text: captchaValue };
}

