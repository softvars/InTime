var storageHelper = new StorageHelper();

function getEntries() {
    //return storageHelper.get(KEY_ENTRIES, []);
    return storageHelper.get(userCurrentDate, []);
}
function createEntry(lbl, val) {
    var ins = getEntries();
    if(lbl) {
        ins.push(new myMap(lbl, val, ins.length));
        //storageHelper.set(KEY_ENTRIES, ins);
        storageHelper.set(userCurrentDate, ins);
    }
    return ins;
}
function getLastEntryState(ins) {
    ins = ins || getEntries();
    var uc_state = ENTRY_OUT
    if(ins.length > 0) {
        var lastEntry = ins[ins.length-1] ;
        uc_state = lastEntry && lastEntry.key
    }
    return uc_state; 
}
function updateView(ins){
    ins = ins || getEntries();
    var uc_state = getLastEntryState(ins)
    if(ins.length === 0) {
        $(".clear-entries").hide();
    }
    storageHelper.set(KEY_UC_STATE, uc_state);
    toggleStrictButton($('.option-strict button'), true);
}

function removeEntry(i) {
    var ins = getEntries();
    if(i >= 0 && i < ins.length) {
        ins.splice(i, 1);
        var nextEntry = ins[i];
        if(nextEntry && nextEntry.m){
            nextEntry.p = nextEntry.m = null;
            ins[i] = nextEntry;
        }
        //storageHelper.set(KEY_ENTRIES, ins);
        storageHelper.set(userCurrentDate, ins);
        //updateView(ins);
	}
    return ins;
}

function renderTimes(lbl, val) {
    var rows = [], _rows = [];
    var ins = createEntry(lbl, val);
    var isEntries = ins && ins.length;
    var total = 0, ntotal =0, n2total=0;
    if(isEntries) {
        ins.forEach(function(a, i, arr){
            if(!(a && a.value)) {
                return;
            }
            var t = getTime(a.value);
            var time = t.h + ":" + t.m + ":" + t.s;
            a.p  = a.p || 0;
            var _diff = a.m || "00", prv = arr[i-1];
            if(!(a.m)) {
                if(prv){
                    var diff = getDiff(a, prv);
                    a.p = diff.p;
                    a.m = _diff = diff.m;
                    arr[i] = a;
                }
                //diff = checkTime(t.h - p.h) + ":" + checkTime(t.m - p.m) + ":" + checkTime(t.s - p.s);
            }
            total += a.p;
            ntotal += (i && (a.key == ENTRY_OUT && ((prv && prv.key == ENTRY_IN) || (prv && prv.key == ENTRY_OUT))) ||  
             (a.key == ENTRY_IN && (prv && prv.key == ENTRY_IN) )) ? a.p : 0;

            n2total += (i && (a.key == ENTRY_OUT && (prv && prv.key == ENTRY_IN)) ||
             (a.key == ENTRY_IN && (prv && prv.key == ENTRY_IN) )) ? a.p : 0;

            rows.push('<tr class="'+CONTEXT[a.key]+'"><td>'+time+'</td><td>'+ _diff +'</td><td class="text-right"><button type="button" data-i="'+i+'" class="btn-remove-entry btn btn-danger btn-xs"> <span data-i="'+i+'" class="removeEntry glyphicon glyphicon-remove-sign"></span></button></td></tr>');
        });
    }
    var _total = getTimeFromTSDiff(total);
    var _ntotal = getTimeFromTSDiff(ntotal);
    var _n2total = getTimeFromTSDiff(n2total);
    _rows.push('<tr class=""><td><strong>Total</strong></td><td>'+ _total.m +'</td><td>'+total+'</td></tr>');
    _rows.push('<tr class="office-total"><td><strong>Total IN</strong></td><td><strong>'+ _ntotal.m +'</strong></td><td>'+ntotal+'</td></tr>');
    _rows.push('<tr class="actual-total"><td><strong>Actual</strong></td><td><strong>'+ _n2total.m +'</strong></td><td>'+n2total+'</td></tr>');
    //storageHelper.set(KEY_ENTRIES, ins);
    storageHelper.set(userCurrentDate, ins);
    storageHelper.set(KEY_TOTAL_TIME, total);

    var htmlStr = _rows.join('') + rows.join('');
    $('#tabletime').html(htmlStr);
    if(isEntries) {
        var isEdit = $("body").data("is-edit");
        if(isEdit) {
            $(".clear-entries, button.btn-remove-entry").show();
        }
    }
    updateView(ins);
    setUserStateText(storageHelper.get(KEY_UC_STATE));
}

//var in_timer_elm_id = 'intimer';
/*function renderTime(elmId) {
    var t = getTime();
    document.getElementById(elmId).innerHTML = t.h + _COLON + t.m + _COLON + t.s + _COLON + t.mi;
}
*/
var renderTime = getRenderTime({
    elm_id: "intimer",
    separator: ":",
    type: 12,
    noDate: true,
    noMilli: true
});

startTimer({
    interval : 1000,
    fn: renderTime
});
/* renderTime.render(); */

var renderDate = getRenderTime({
    elm_id: "entryDate",
    separator: ":",
    noTime: true,
    type: 12
});

function doIn(){
    //storageHelper.set(KEY_UC_STATE, ENTRY_IN);
    renderTimes(ENTRY_IN, (new Date()).getTime());
}

function doOut(){
    //storageHelper.set(KEY_UC_STATE, ENTRY_OUT);
    renderTimes(ENTRY_OUT, (new Date()).getTime());
}

$(".btn-clear-entries").off("click");
$(".btn-clear-entries").on("click", function() {
    storageHelper.unset(userCurrentDate);
    //storageHelper.set(KEY_UC_STATE, ENTRY_OUT);
    //toggleStrictButton($('.option-strict button'), true);
    renderTimes();
    $(".clear-entries").hide();
});


$('table#tabletime').off("click");
$('table#tabletime').on("click", "button.btn-remove-entry",function(e) {
    var i = $(this).data("i");
    console.log(i);
    removeEntry(i);
    renderTimes();
});

$('.settings-menu.enabled').off("click");
$('.settings-menu.enabled').on("click", ".toolbar.strict", function(e) {
    $('.option-strict').show();
    $('.option-flex').hide();
    toggleStrictButton($('.option-strict button'), true);
});

$('.settings-menu.enabled').on("click", ".toolbar.flex", function(e) {
    $('.option-strict').hide();
    $('.option-flex').show();
});

$('.option-strict').off("click");
$('.option-strict').on("click", "button.enabled", function(e) {
    var uc_state = toggleStrictButton($(this), false);
    if(uc_state == ENTRY_OUT) {
       doIn();
    } else {
       doOut();
    }
});

$('.option-flex').off("click");
$('.option-flex').on("click", "button.enabled", function(e) {
    var $this= $(this);
    var isIn = $this.hasClass('swip-in');
    var isOut = $this.hasClass('swip-out');
    if(isIn) {
       doIn();
    } else if(isOut){
       doOut();
    }
});

$('.menu').off("click");
$('.menu').on("click", "button.edit.enabled", function(e) {
    var ins = getEntries();
    var isEntries = ins && ins.length;
    if(isEntries) {
        $("body").data("is-edit", true);
        storageHelper.set(KEY_ENTRIES_UNDO, ins);
        $(".confirm-edit, button.btn-remove-entry").show();
        $(".clear-entries").show();
        $(this).addClass('active');
        $(".option-swip button").addClass('disabled');
        $(".option-swip button").removeClass('enabled');
        $(".last-row").addClass('edit-start');

        $(".tools .toolbar").addClass('disabled');
        $(".tools .toolbar").removeClass('enabled');
    }
});

$(".confirm-edit").off("click");
$(".confirm-edit").on("click", "button", function(){
    $this = $(this);
    if($this.hasClass("btn-done-edit")){
        //done
    } else if($this.hasClass("btn-cancel-edit")) {
        var ins = storageHelper.get(KEY_ENTRIES_UNDO, []);
        //storageHelper.set(KEY_ENTRIES, ins);
        storageHelper.set(userCurrentDate, ins);
        //updateView(ins);
        renderTimes();
    }
    $(".clear-entries, .confirm-edit, button.btn-remove-entry").hide();
    $("body").data("is-edit", false);
    $('.menu button.edit').removeClass('active');
    $(".option-swip button").removeClass('disabled');
    $(".option-swip button").addClass('enabled');
    $(".tools .toolbar").addClass('enabled');
    $(".tools .toolbar").removeClass('disabled');
    $(".last-row").removeClass('edit-start');
});

/* $('#myDateListModal').on('shown.bs.modal', function () {
    var htmlStr = renderDateListModal()
    $('.modal-body ul').html(htmlStr);
}) */

$('.tools').off("click");
$('.tools').on("click", "button.dateList.enabled", function(e) {
    toggleMenu();
})

function toggleMenu(){
    $(".mainContent").toggle();
    $(".data-list-wrapper").toggle();
    //$('.tools .toolbar, .menu button.edit').not(this).toggleClass('enabled disabled');
    $('.toolbar.edit, .toolbar.dateList, .toolbar.goback, .toolbar.dropdown-toggle').toggle();
}
//$('.menu').off("click");
$('.menu').on("click", "button.goback.enabled", function(e) {
    toggleMenu();
})

$('.data-list-wrapper').off("click");
$('.data-list-wrapper').on("click", ".date-list", function(e) {
    $('.tools button.dateList.enabled').trigger( "click" );
    userCurrentDate = $(this).data('date-key');
    storageHelper.set(KEY_UC_DATE, userCurrentDate);
    $('.data-list-wrapper .date-list').not(this).removeClass('active');
    $(this).addClass('active');
    page_init();
    //renderDateListModal();
})

function renderDateListModal() {
    var html = ''
    getDateKeys(function(o){
        html += '<li role="presentation" class="date-list" data-date-key="'+o.key+'"><a href="#">'+o.label+'</a></li>'
    })
    //return html;
    $('.data-list-wrapper .date-list-group').html(html);
}
$(".data-list-wrapper").hide();
//$(".goback").hide();

var getDateFromKeys =function(k){
    return (k && k.endsWith(KEY_DAY_ENTRIES) && k.split('_')[0]) || ''
};

function getDateKeys(fn) {
    if(typeof fn === "function") {
        storageHelper.each(function(k){
            console.log(k)
            var l = getDateFromKeys(k)
            if(l){
                /* fn({key:k, label:l, value:storageHelper.get(k)}); */
                fn({key:k, label:l});
            }
        })
    }
}

var userCurrentDate = KEY_DATE_ENTRIES
storageHelper.set(KEY_UC_DATE, KEY_DATE_ENTRIES);

function day_init() {
    //userCurrentDate = storageHelper.get(KEY_UC_DATE);
    var todayEntries = storageHelper.get(userCurrentDate);
    if(!(todayEntries)) {
        //storageHelper.set(KEY_ENTRIES, []);
        storageHelper.set(userCurrentDate, []);
        //storageHelper.set(KEY_UC_STATE, ENTRY_OUT);
    }
    var l = getDateFromKeys(userCurrentDate)
    if (l){
        var dateStr = l.substring(4, 0) + '/' + l.substring(6, 4)+ '/' + l.substring(6)
        var d = new Date(dateStr);
        renderDate.render(d);
    }
    //userCurrentDate = storageHelper.get(KEY_UC_DATE);
    /* if(!userCurrentDate) {
        userCurrentDate = KEY_DATE_ENTRIES
    } */
    //storageHelper.set(KEY_UC_STATE, (storageHelper.get(KEY_UC_STATE) || ENTRY_OUT));
}

function setUserStateText(state){
    $('.status-info span.user-state').get(0).innerText = state;
}

function setupStrictButton($elm, state) {
    $elm.children('span.ti-btn-lbl').get(0).innerText = state;
    $elm.addClass(state == ENTRY_IN ? 'btn-primary' : 'btn-warning swip-out');
    $elm.removeClass(state == ENTRY_OUT ? 'btn-primary' : 'btn-warning swip-out');
}

function toggleStrictButton($elm, noswap) {
    if($elm) {
        var uc_state = storageHelper.get(KEY_UC_STATE);
        var state = (!!(noswap) && ((uc_state == ENTRY_IN) ? ENTRY_OUT : ENTRY_IN)) || uc_state;
        setupStrictButton($elm, state);
        return uc_state;
    }
}

function page_init() {
    //toggleStrictButton($('.option-strict button'), true);
    day_init();
    $(".goback").hide();
    renderTimes();
}

$(function(){
    page_init();
    renderDateListModal();
});
