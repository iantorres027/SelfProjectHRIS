const defaultColor = "#476985";
let colorToset = "";

colorToset = window.localStorage.getItem('topNavColor') || defaultColor;

loadNavSelectedColor(colorToset);

$(function () {
    $(".color-item").click(function () {
        let color = $(this).data("value");
        loadNavSelectedColor(color);
    });

    $("#color-select").val(colorToset);

    $("#color-select").on("input change", function () {
        let color = $(this).val();
        loadNavSelectedColor(color);
    });

    $("#resetBtn").click(function () {
        loadNavSelectedColor(defaultColor);
    });
})

function loadNavSelectedColor(color = "") {
    let colorToSet = color == "" ? defaultColor : color;

    window.localStorage.setItem('topNavColor', colorToSet);
    let changeColorStyle = $("#changeColorStyle");

    let cssToInsert = `
        .navbar-custom {
            background-color: ${colorToSet};
           
        }

        body[data-sidebar-color="brand"] .left-side-menu,
        body[data-sidebar-color="gradient"] .left-side-menu {
            background-color: ${colorToSet};
            box-shadow: none;
        }

        body[data-sidebar-color="brand"] .logo-box,
        body[data-sidebar-color="gradient"] .logo-box {
            background-color: ${colorToSet};
        }

        @media (min-width: 992px) {
            body[data-layout-mode="horizontal"][data-topbar-color="light"] .topnav {
                background-color: ${colorToSet};
            }
        }

        @media (max-width: 991.98px) {
            body[data-layout-mode="horizontal"] .navbar-toggle span {
                height: 2px;
                width: 100%;
                background-color: #838b91;
                display: block;
                margin-bottom: 5px;
                transition: transform .5s ease;
            }
        }`;

    if (changeColorStyle.length == 1) {
        changeColorStyle.html(cssToInsert);
    } else {
        $('head').append(` <style type="text/css" id="changeColorStyle">${cssToInsert}</style>`);
    }
}