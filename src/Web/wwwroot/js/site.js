"use strict"

const baseUrl = $("#txtBaseUrl").val();
let localizedStrings;

loadLocalizedStrings();
function loadLocalizedStrings() {
    $.ajax({
        url: '/Localization/GetLocalizedStrings',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            // Store the localized strings in a JavaScript variable or object
            localizedStrings = data;
        },
        error: function (error) {
            console.error('Failed to fetch localized strings:', error);
        }
    });
}

function localizer(input) {
    return localizedStrings[input] ?? input;
}

$(function () {
    //$.fn.dataTable.ext.errMode = function (settings, helpPage, message) {
    //    messageBox(message, "error", true)
    //};
    $(window).resize(function () {
        $($.fn.dataTable.tables(true)).DataTable().columns.adjust();
    });
    $(document).on("shown.bs.modal shown.bs.tab shown.bs.collapse", function () {
        $($.fn.dataTable.tables(true)).DataTable().columns.adjust();
    });

    $(document).on("input change keypress", "select, input, textarea", function () {
        try { $(this).valid(); } catch (e) { }
    });

    $(document).on("change", ".decimalInputMask", debounce(function () {
        let amount = $(this).val();
        amount = Number(amount.replace(/[^-?0-9\.]+/g, ""));

        if (amount > 0)
            $(this).val(numeral(amount).format("0,0.00"));
    }, 800));
});

function messageBox(message, type = "success", isToastr = false, isTimed = true) {
    var title = "";

    switch (type) {
        case "danger": title = 'Alert!'; break;
        case "info": title = 'Information'; break;
        case "warning": title = 'Warning!'; break;
        case "success": title = 'Success!'; break;
        default:
    }

    if (type == "danger") type = "error";

    if (isToastr) {
        if (typeof (message) === "object") {
            console.log(message);
            toastr.error(message, title);
        } else {
            if (type == "danger" || type == "error")
                toastr.error(message, title);
            else if (type == "info")
                toastr.info(message, title);
            else if (type == "success")
                toastr.success(message, title);
            else
                toastr.warning(message, title);
        }
    }
    else if (isTimed) {
        if (typeof (message) === "object") {
            console.log(message);
            Swal.fire({
                icon: type,
                title: title,
                html: 'Error Occurred! - Please see error logs for more information',
                timer: 2000,
                timerProgressBar: true
            });
        } else
            Swal.fire({
                icon: type,
                title: title,
                html: message,
                timer: 2000,
                timerProgressBar: true
            });
    }
    else {
        if (typeof (message) === "object") {
            console.log(message);
            Swal.fire(title, 'Error Occurred! - Please see error logs for more information', type);
        } else Swal.fire(title, message, type);
    }
}

function convertDate(data, format = "YYYY-MM-DD") {
    let toReturn = "";

    if (data == "0001-01-01T00:00:00.000" || data == "0001-01-01T00:00:00" || data == null) {
        data = "";
    }

    if (moment(new Date(data)).isValid())
        toReturn = moment(new Date(data)).format(format);

    return toReturn;
}

function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;    
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

