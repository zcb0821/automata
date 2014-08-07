var fa = fa || {};

fa.SELECT = 0;
fa.STATE = 1;
fa.LINK = 2;
fa.REMOVE = 3;

fa.RADIUS = 25;

// update the postion of a svg element
fa.update = function(x, y) {
    if (this.attr('cx')) {
        this.attr({
            'cx': x,
            'cy': y,
        })
    } else {
        this.attr({
            'x': x,
            'y': y,
        })
    }
}

/**
 * 求圆(cx, cy, r)和过(x, y), (cx, cy)的直线的交点
 * @param cx 圆心的x坐标
 * @param cy 圆心的y坐标
 * @param r 半径
 * @param x 点x坐标
 * @param y 点y坐标
 * @return 交点坐标{
 *      x: number x坐标
 *      y: number y坐标
 * }
 */
fa.getPoint = function(cx, cy, r, x, y, correction) {
    var dx = x - cx;
    var dy = y - cy;
    rx = ry = correction || 0;
    rx = dx > 0 ? rx : -rx;
    ry = dy > 0 ? ry : -ry;
    var rate = r / Math.sqrt(dx * dx + dy * dy);

    var p = {}
    p.x = cx + dx * rate + rx;
    p.y = cy + dy * rate + ry;
    return p;
}

/**
 * 求曲线的中点坐标
 * @param path 曲线的svg路径
 * @return {
 *      x:      number x 坐标
 *      y:      number y 坐标
 *      alpha:  number 导数（切线）的角度
 *  }
 */
fa.getMiddlePoint = function(path) {
    var len = Raphael.getTotalLength(path);
    var point = Raphael.getPointAtLength(path, len / 2);
    return point;
}


/**
 * @type function 获取两个圆之间控制点为(x, y)的svg路径
 * @param startCircle 圆
 * @param endCircle 圆
 * @param [x] 控制点的x坐标
 * @param [y] 控制点的y坐标
 * @return svg路径
 */
fa.getPath = function(x1, y1, x2, y2, x, y) {
    // 不同的圆
    if (x1 != x2 || y1 != y2) {
        var p1 = fa.getPoint(x1, y1, fa.RADIUS, x, y),
            p2 = fa.getPoint(x2, y2, fa.RADIUS, x, y, 3);
    }
    // 相同的圆
    else {
        var p = fa.getPoint(x1, y1, fa.RADIUS, x, y),
            p1 = fa.getRotate(x1, y1, p.x, p.y, -45),
            p2 = fa.getRotate(x2, y2, p.x, p.y, 45);
    }
    return [
        ['M', p1.x, p1.y], ['Q', x, y, p2.x, p2.y]
    ]
}

/**
 * type function 求出文本在曲线的哪一侧
 * @param path svg路径
 * @return [x坐标的加减性，y坐标的加减性]
 */
fa.getDirection = function(path) {
    var x1 = path[0][1];
    var y1 = path[0][2];
    var x2 = path[1][3];
    var y2 = path[1][4];
    var x = path[1][1];
    var y = path[1][2];

    if (x1 == x2)
        return [1, 0];
    else if (y1 == y2)
        return [0, -1];
    else {
        var k = (y1 - y2) / (x1 - x2);
        var b = y1 - k * x1;
        var ky = k * x + b;

        if (k > 0 && y > ky)
            return [-1, 1];
        else if (k > 0 && y <= ky)
            return [1, -1];
        else if (k < 0 && y >= ky)
            return [1, 1];
        else
            return [-1, -1];
    }
}

/**
 * type function 获取点(x, y)相对于(cx, cy)顺时针旋转角度angle之后的位置
 * @param cx & cy 旋转中心点的x坐标和y坐标
 * @param x & y 旋转点的x坐标和y坐标
 * @param angle 顺时针旋转角度
 */
fa.getRotate = function(cx, cy, x, y, angle) {
    var sin_angle = Math.sin(Raphael.rad(angle));
    var cos_angle = Math.cos(Raphael.rad(angle));
    var newx = (x - cx) * cos_angle - (y - cy) * sin_angle + cx;
    var newy = (x - cx) * sin_angle + (y - cy) * cos_angle + cy;
    return {
        'x': newx,
        'y': newy
    }
}

/**
 * type function 获取点(x, y)到直线(x1, y1),(x2, y2)的距离
 * @param
 * @param
 * @param
 */
fa.getDistance = function(x1, y1, x2, y2, x, y) {
    if (x1 == x2) {
        return Math.abs(x - x1);
    } else {
        var k = (y1 - y2) / (x1 - x2);
        var b = y1 - k * x1;
        return Math.abs((k * x + b - y) / Math.sqrt(k * k + 1));;
    }
}