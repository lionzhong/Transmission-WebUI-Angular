/**
 * Created by vincent on 2017/3/5.
 */
define(["jquery", "lodash"], function ($, _) {
    "use strict";

    //解析对象是否为空对象
    var isEmptyObj = function (obj) {
        var p, c = true;
        for (p in obj) {
            if (p === undefined) {
                c = true;
                break;
            } else {
                c = false;
            }
        }
        return c;
    };

    //ng异步promise
    var ngAjaxPromise = function (op) {
        // op = {
        //     type:"", get或者post
        //     url:"", 请求地址
        //     param:{}/"",请求的参数
        //     err:"",报错时的提示文字
        //     $http:{},ng $http对象
        //     $q:{},ng $q对象
        //     cancel:true 是否可以取消
        // }
        var dfd = op.$q.defer();

        //设置异步对象
        var ajax = {};
        switch (op.type) {
            case "post":
                ajax = op.$http.post(op.url, op.param);
                break;
            case "get":
                ajax = op.param.params ? op.$http.get(op.url, op.param) : op.$http.get(op.url + op.param);
                break;
            case "put":
                ajax = op.$http.put(op.url, op.param);
                break;
            case "patch":
                ajax = op.$http.patch(op.url, op.param);
                break;
            case "delete":
                ajax = op.$http.delete(op.url, op.param);
                break;
        }

        op.$q.when(ajax,function (response, status, headers, config) {
            dfd.resolve(response);
        },function (response, status) {
            if (status !== 0) {
                dfd.reject({
                    errService:op.errService ? op.errService : "Service Error",
                    err:op.err,
                    response:response
                });
            }
        });

        return op.cancel?dfd:dfd.promise;
    };

    //解析数据，保留小数点2位并转换为数字类型
    var parseZero = function (num) {
        return num === 0 ? 0 : parseFloat(num.toFixed(2));
    };

    //容量自动转换器
    var bytesConvert = function (op) {
        // op = {
        //     "data": number,需要转换单位的数据，数字类型
        //     "customUnit": "bits",自定义单位，转换后将会变成K+自定义单位，例如Kbits
        //     "band": 1024,转换单位时的整除数，默认是1000(可选参数)
        //     "minUnit": "K",最小单位，默认为K，当低于K时，需要显示正数时则设为minUnit:true，目前暂时只支持到最小到K和K以下(可选参数)
        //     "spliceUnit": true但你需要分开数字和单位时，则需要此参数。输出的数据则变为对象{num:number,unit:"string"}(可选参数)
        // }
        var num = "";
        var unit = "";
        var band = op.band ? op.band : 1000;

        op.minUnit = op.minUnit ? op.minUnit : "K";

        if (op.minUnit === true) {
            if (op.data < band) {
                num = op.data;
                unit = "B";
            }

            if (op.data >= band && op.data < Math.pow(band, 2)) {
                num = (op.data / Math.pow(band, 1));
                unit = "KB";
            }
        }

        if (op.minUnit === "K") {
            if (op.data < Math.pow(band, 2)) {
                num = (op.data / Math.pow(band, 1));
                unit = "KB";
            }
        }

        if (op.data >= Math.pow(band, 2) && op.data < Math.pow(band, 3)) {
            num = (op.data / Math.pow(band, 2));
            unit = "MB";
        }

        if (op.data >= Math.pow(1024, 3) && op.data < Math.pow(band, 4)) {
            num = (op.data / Math.pow(band, 3));
            unit = "GB";
        }

        if (op.data >= Math.pow(1024, 4)) {
            num = (op.data / Math.pow(band, 4));
            unit = "TB";
        }

        function isPositiveNum(s) {//是否为正整数
            var re = /^[0-9]*[1-9][0-9]*$/;
            return re.test(s);
        }

        if (num === 0) {
            num = 0;
        }

        if (num > 0) {
            if (isPositiveNum(num) === false) {
                num = num.toFixed(2);
            }
        }

        unit = op.customUnit !== undefined ? unit.replace("B", op.customUnit) : unit;

        return op.spliceUnit === true ? {num: num, unit: unit} : num + unit;
    };

    //流量自动转换器
    var flowConvert = function (op) {
        return bytesConvert(op);
    };

    //获取指定日期的时间戳，正整数为今天以后，负整数为今天以前，0为今天
    var getDay = function (op) {
        if (!op) {
            op = {};
        }
        if (op.type === undefined) {
            op.type = "YYYY/MM/DD";
        }

        var $fulldate = "";
        var date = new Date();
        var MS = (function () {
            return 1000 * 60 * 60 * 24 * (op.days !== undefined ? op.days : 1);
        })();

        var theDayObj = new Date();
        var theDayMS = date.getTime() + MS;

        theDayObj.setTime(theDayMS);

        //读取默认格式
        if (op.type === "YYYY/MM/DD") {
            $fulldate = theDayObj.getFullYear() + "/" + (theDayObj.getMonth() + 1) + "/" + theDayObj.getDate();
        }

        //是否以此时此刻开始计算
        if (op.now === true) {
            $fulldate += " " + theDayObj.getHours() + ":" + theDayObj.getMinutes() + ":" + theDayObj.getSeconds();
        } else {
            $fulldate += " 00:00:00";
        }

        //是否需要转换成毫秒
        if (op.needMS === true) {
            $fulldate = new Date($fulldate).getTime();
        }

        return $fulldate;
    };

    //转换时间中小时，分钟，秒小于10的时候拼接为00:00:00格式
    var parseDate = function (YY, MM, DD) {
        var $date = "";

        if (YY === 0 && MM === 0 && DD === 0) {
            $date = "";
        } else {
            if (YY < 10) {
                $date += "0" + YY;
            } else {
                $date += YY;
            }

            if (MM < 10) {
                $date += "-0" + MM;
            } else {
                $date += "-" + MM;
            }

            if (DD !== undefined) {
                if (DD < 10) {
                    $date += "-0" + DD;
                } else {
                    $date += "-" + DD;
                }
            }
        }
        return $date;
    };

    //转换时间中小时，分钟，秒小于10的时候拼接为00:00:00格式
    var parseTime = function (HH, MM, SS) {
        var $time = "";

        if (HH === 0 && MM === 0 && SS === 0) {
            $time = "";
        } else {
            if (HH < 10) {
                $time += "0" + HH;
            } else {
                $time += HH;
            }

            if (MM < 10) {
                $time += ":0" + MM;
            } else {
                $time += ":" + MM;
            }

            if (SS !== undefined) {
                if (SS < 10) {
                    $time += ":0" + SS;
                } else {
                    $time += ":" + SS;
                }
            }
        }
        return $time;
    };

    var parseFullDate = function (date, simple) {
        var $date = new Date(date);
        var fullDate = parseDate($date.getFullYear(), $date.getMonth() + 1, $date.getDate());
        var fullTime = parseTime($date.getHours(), $date.getMinutes(), $date.getSeconds());
        return simple !== true ? fullDate + " " + fullTime : fullDate;
    };

    var secondsToTime = function (second) {
        if (!second) {
            return 0;
        }
        var time = '';
        if(second >= 24 * 3600 * 365){
            time += parseInt(second / (24 * 3600 * 365)) + '年';
            second %= 24 * 3600 * 365;
        }

        if (second >= 24 * 3600) {
            time += parseInt(second / (24 * 3600)) + '天';
            second %= 24 * 3600;
        }
        if (second >= 3600) {
            time += parseInt(second / 3600) + '小时';
            second %= 3600;
        }
        if (second >= 60) {
            time += parseInt(second / 60) + '分钟';
            second %= 60;
        }
        if (second > 0) {
            time += second + '秒';
        }
        return time;
    };

    //保留小数点后面两位并转化为浮点数字类型
    var parseFloat2 = function (num) {
        return parseFloat((parseZero(num)).toFixed(2));
    };

    //当目标滚动窗口时，目标对象距离当前窗口顶部0像素时，固定此对象在窗口顶部（fixed）
    function FixedBar(op) {
        this.target = $("#" + op.id);
        this.classname = "fixed";
        this.scroll = function () {
            var $this = this;
            setTimeout(function () {
                var objTop = $this.target.offset().top;
                var objWidth = $this.target.width();
                $(window).scroll(function () {
                    if ($(this).scrollTop() >= objTop) {
                        $this.target.addClass($this.classname);
                        $this.target.css({"width": objWidth});
                    } else {
                        $this.target.removeClass($this.classname);
                        $this.target.css({"width": "auto"});
                    }
                });
            }, 300);
        };
        this.init = function () {
            this.scroll();
        };
        this.init();
    }

    //多选框绑定组件
    var checkboxGroup = function CheckboxGroup(op, scope) {
        /*例子
         checkboxGroup({
         "source": $scope.checkBoxData,//数据源
         "initBind": ["checkedBoxes",$scope.initData],//[ng绑定的选中变量,初始化选中的数据]
         "getCheckedBind":["getChecked","checkReuslt"]//[ng绑定获取结果数据的方法名,ng绑定结果数据]
         },$scope);
         */

        //初始化数据
        this.sourceData = op.source;
        this.initData = op.initBind ? op.initBind[1] : false;

        //初始化各checkbox是否选中
        this.initCheckboxGroup = function (op) {
            //设置所有checkbox默认为都不选中
            var arr = [];
            var l = op.source.length;
            for (var i = 0; i < l; i++) {
                arr.push(false);
            }

            //如果存在初始化数据，则将iniData数据做匹配，将对应arr中的check位置改为true
            if (op.initData) {
                var initLength = op.initData.length;
                for (var k = 0; k < initLength; k++) {
                    var $this = op.initData[k];
                    for (var j = 0; j < l; j++) {
                        if ($this === op.source[j]) {
                            arr[k] = true;
                        }
                    }
                }
            }
            scope.tests = "3";
            return arr;
        };

        //获取选中的checkbox数据
        this.getChecked = function (op) {
            var l = this.sourceData.length;
            var arr = [];
            for (var i = 0; i < l; i++) {
                if (op.result[i] === true) {
                    arr.push(this.sourceData[i]);
                }
            }
            return arr;
        };

        //初始化多选框绑定组件
        this.init = function () {
            var $this = this;
            var initOp = {"source": $this.sourceData};

            if ($this.initData) {
                initOp.initData = $this.initData;
            }

            var scopeCheckedVar = op.initBind[0];
            var scopeGetCheckedFunc = op.getCheckedBind[0];
            var scopeResultVar = op.getCheckedBind[1];

            scope[scopeCheckedVar] = $this.initCheckboxGroup(initOp);
            scope[scopeGetCheckedFunc] = function () {
                scope[scopeResultVar] = $this.getChecked({"result": scope[scopeCheckedVar]});
                console.log(scope[scopeResultVar]);
            };
        };
        this.init();
    };

    //自适应高宽
    var autosize = function (op) {
        function parseSize(name, num) {
            $(window).resize(function () {
                if (($(window)[name]() - dif[name]) > num) {
                    target[name]($(window)[name]() - dif[name]);
                }
            });
            $(document).change(function () {
                if (($(window)[name]() - dif[name]) > num) {
                    target[name]($(window)[name]() - dif[name]);
                }
            });
        }

        if (op) {
            var target = op.target;
            var H = $(window).height();
            var W = $(window).width();
            var targetH = target.height();
            var targetW = target.width();
            var dif = op.dif ? op.dif : {"height": 0, "width": 0};

            if (op.autoset) {
                if (op.autoset.width === true) {
                    if (targetW < W) {
                        target.width(W - dif);
                    }
                }

                if (op.autoset.widthAuto === true) {
                    parseSize("width", targetW);
                }

                if (op.autoset.height === true) {
                    if (targetH < H && (H - dif.height) > targetH) {
                        target.height(H - dif.height);
                    }
                }

                if (op.autoset.heightAuto === true) {
                    parseSize("height", targetH);
                }
            }
        }
    };

    //批量/单个echart图表初始化。
    var initEchart = function (op, echart) {
        var charts = [];
        var l = op.length;

        if (op && l > 0) {
            for (var i = 0; i < l; i++) {
                charts.push(echart.init(document.getElementById(op[i].id)));
                charts[i].setOption(op[i].option);
            }

            $(window).resize(function () {
                for (var k = 0; k < l; k++) {
                    charts[k].resize();
                }
            });
        }

        if (!l && op.id && op.option) {
            charts = echart.init(document.getElementById(op.id));
            charts.setOption(op.option);
            $(window).resize(function () {
                charts.resize();
            });
        }

        return charts;
    };

    //图表组件默认颜色组
    var colorGroup = ["#F7DC6F", "#A9CCE3", "#D7BDE2", "#AF7AC5", "#26C6DA", "#7986CB", "#A3E4D7", "#52BE80", "#E59866", "#B2BABB", "#F1948A", "#3498DB", "#D0D3D4", "#E74C3C", "#9FA8DA", "#A1887F", "#C5E1A5", "#FFC107"];

    return {
        "isEmptyObj": isEmptyObj,
        "ngAjaxPromise": ngAjaxPromise,
        "parseZero": parseZero,
        "flowConvert": flowConvert,
        "bytesConvert": bytesConvert,
        "getDay": getDay,
        "parseDate": parseDate,
        "parseTime": parseTime,
        "parseFullDate": parseFullDate,
        "parseFloat2": parseFloat2,
        "FixedBar": FixedBar,
        "checkboxGroup": checkboxGroup,
        "autoSize": autosize,
        "initEchart": initEchart,
        "colorGroup": colorGroup,
        "secondsToTime":secondsToTime
    };
});