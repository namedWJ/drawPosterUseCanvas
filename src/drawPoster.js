/** 
 * 
 * [Array Object]
 * {
 * type: img | text
 * url: 图片地址
 * needRadius: 是否需要圆角
 * x: x轴的距离
 * y: y轴的距离
 * width: 宽度
 * height: 高度
 * font: 字体大小
 * color: 字体颜色
 * content: 文字内容
 * }
 * 
 * 
*/
const getBase64Image = (img) => {
    let canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    return canvas.toDataURL('image/png');
};

const getImgBase64 = (src) => new Promise((resolve, reject) => {
    let image = new Image();
    image.src = `${src}?v=${Math.random()}`; // 为了处理缓存
    image.crossOrigin = '*';
    image.onload = () => {
        let base64 = getBase64Image(image);
        resolve(base64);
    };
});

const circleImg = (src, res) => new Promise((resolve) => {
    let radius;
    let diameter;
    let canvas;
    const image = new Image();
    image.src = src;
    image.onload = () => {
        if (image.width > image.height) {
            radius = image.height / 2;
        } else {
            radius = image.width / 2;
        }
        diameter = radius * 2;
        canvas = document.createElement('canvas');
        canvas.width = diameter;
        canvas.height = diameter;
        const contex = canvas.getContext('2d');
        contex.clearRect(0, 0, diameter, diameter);
        contex.save();
        contex.beginPath();
        contex.arc(radius, radius, radius, 0, Math.PI * 2, false);
        contex.clip();
        contex.drawImage(image, 0, 0);
        resolve(canvas.toDataURL('image/png'));
    };
});

const drawImg = (res) => new Promise((resolve, reject) => {
    const tempImg = new Image();
    if (res.url.indexOf('http') === -1) {
        if (res.needRadius) { // 如果需要圆角
            tempImg.src = circleImg(res.url);
        } else {
            tempImg.src = res.url;
        }
        tempImg.onload = () => {
            resolve(tempImg);
        };
    } else {
        getImgBase64(res.url).then((resp) => {
            if (res.needRadius) {
                circleImg(resp, res).then((ul) => {
                    tempImg.src = ul;
                    tempImg.onload = () => {
                        resolve(tempImg);
                    };
                });
            } else {
                tempImg.src = resp;
                tempImg.onload = () => {
                    resolve(tempImg);
                };
            }
        });
    }
});

const drawText = (res) => new Promise((resolve, reject) => {
    const tempDom = document.createElement('canvas');
    tempDom.width = res.width;
    tempDom.height = res.height;
    const textCtx = tempDom.getContext('2d');
    typeof res.font === 'string' && (textCtx.font = `${res.font.indexOf('px') > -1 ? res.font : `${res.font}px`} sans-serif`);
    typeof res.font === 'number' && (textCtx.font = `${res.font}px sans-serif`);
    textCtx.fillStyle = res.color;
    textCtx.textBaseline = res.textBaseline || 'middle';
    textCtx.textAlign = res.textAlign || 'center';
    textCtx.fillText(res.content, res.width / 2 || 0, res.height / 2 || 0);
    const img = new Image();
    img.src = tempDom.toDataURL('image/png');
    img.onload = () => {
        resolve(img);
    };
});

const getCtx = (args) => {
    const rootDom = document.createElement('canvas');
    const rootCtx = rootDom.getContext('2d');
    let start = 0;
    let len = args.length;
    let src = '';
    const fn = (resp) => new Promise((resolve, reject) => {
        const draw = (res = resp) => {
            if (res.type === 'img') {
                drawImg(res).then((imgRes) => {
                    start === 0 && (rootDom.width = imgRes.width);
                    start === 0 && (rootDom.height = imgRes.height);
                    rootCtx.drawImage(imgRes, res.x || 0, res.y || 0,
                        res.width || imgRes.width, res.height || imgRes.height);
                    start += 1;
                    if (start >= len) {
                        src = rootDom.toDataURL('image/png');
                        resolve(src);
                    } else {
                        draw(args[start]);
                    }
                });
            } else if (res.type === 'text') {
                drawText(res).then((tResp) => {
                    rootCtx.drawImage(tResp, res.x || 0, res.y || 0);
                    start += 1;
                    if (start >= len) {
                        src = rootDom.toDataURL('image/png');
                        resolve(src);
                    } else {
                        draw(args[start]);
                    }
                });
            }
        };
        draw(resp);
    });
    return fn(args[start]);
};

export default getCtx;
