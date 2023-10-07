$(function () {
    var xhr;
    var moduleTypeDropdown, $moduleTypeDropdown;
    var parentModuleDropdown, $parentModuleDropdown;

    //#region Initialization

    rebindValidators();

    //#region Selectize

    $(".selectize").selectize();
    $moduleTypeDropdown = $('#Module_ModuleTypeId').selectize({
        valueField: 'id',
        labelField: 'description',
        searchField: ['description'],
        selectOnTab: true,
        preload: true,
        onChange: function (value) {
            parentModuleDropdown.setValue("");
            parentModuleDropdown.disable();
            parentModuleDropdown.clearOptions();
            parentModuleDropdown.load(function (callback) {
                xhr && xhr.abort();
                xhr = $.ajax({
                    url: baseUrl + "Module/GetParentModules/",
                    data: {
                        moduleTypeId: $("#Module_ModuleTypeId").val()
                    },
                    success: function (results) {
                        if (!results.length) parentModuleDropdown.disable();
                        else parentModuleDropdown.enable();

                        callback(results);
                    },
                    error: function () {
                        callback();
                    }
                })
            });
        },
        load: function (query, callback) {
            $.ajax({
                url: baseUrl + "Module/GetModuleTypes/",
                success: function (results) {
                    callback(results);
                },
                error: function () {
                    callback();
                }
            });
        },
        render: {
            option: function (item, escape) {
                return ("<div class='py-1 px-2'>" +
                    escape(item.description) +
                    "</div>"
                );
            }
        }
    });
    $parentModuleDropdown = $('#Module_ParentModuleId').selectize({
        valueField: 'id',
        labelField: 'description',
        searchField: ['description'],
        preload: true,
        onType: function () {
            //this.$input[0].selectize.renderCache = {};
            //this.$input[0].selectize.clearOptions();
            this.$input[0].selectize.refreshOptions(true);
        },
        render: {
            option: function (item, escape) {
                return ("<div class='py-1 px-2'>" +
                    escape(item.Description) +
                    "</div>"
                );
            }
        }
    });

    moduleTypeDropdown = $moduleTypeDropdown[0].selectize;
    parentModuleDropdown = $parentModuleDropdown[0].selectize;
    parentModuleDropdown.disable();

    //#endregion Selectize

    $('#tbl_module_stages tbody').sortable({
        stop: function (event, ui) {
            fixElementSequence(".stage_row");
            rebindValidators();
        },
        handle: "span.ui-widget-header"
    });

    var tbl_modules = $("#tbl_modules").DataTable({
        ajax: {
            url: baseUrl + "Module/GetModules",
            dataSrc: ""
        },
        language: {
            processing: "<div class='text-center'><span class='spinner-border spinner-border-sm'></span> Loading...</div>",
            previous: "<i class='mdi mdi-chevron-left'>",
            next: "<i class='mdi mdi-chevron-right'>"
        },
        columns: [
            {
                data: "id",
                class: "text-center ps-2"
            },
            {
                data: "code"
            },
            {
                data: "description"
            },
            {
                data: "moduleType"
            },
            {
                data: "approvalRouteType"
            },
            {
                data: "controller",
                render: function (data, type, row) {
                    return `${row.Controller || ""}/${row.Action || ""}`;
                }
            },
            {
                data: "parentModule"
            },
            {
                data: "icon",
                class: "text-center"
            },
            {
                data: "ordinal",
                class: "text-center"
            },
            {
                data: "isDisabled",
                class: "text-center",
                render: function (data, type, row) {
                    return data ? `<span class="fe-x"><label hidden>true</label></span>` : `<span class="fe-check"><label hidden>false</label></span>`;
                }
            },
            {
                data: "isVisible",
                class: "text-center",
                render: function (data, type, row) {
                    return data ? `<span class="fe-eye"><label hidden>true</label></span>` : `<span class="fe-eye-off"><label hidden>false</label></span>`;
                }
            },
            {
                data: "inMaintenance",
                class: "text-center",
                render: function (data, type, row) {
                    return data ? `<span class="fe-check"><label hidden>true</label></span>` : `<span class="fe-x"><label hidden>true</label></span>`;
                }
            }
        ],
        //createdRow: function (row, data, dataIndex) {
        //    let ParentId = data.ParentModuleId;
        //    let Id = data.Id;

        //    if (ParentId == null) {
        //        $(row).addClass(`treegrid-${Id}`);
        //    } else {
        //        $(row).addClass(`treegrid-${Id} treegrid-parent-${ParentId}`);
        //    }
        //},
        drawCallback: function () {
            $(".dataTables_paginate > .pagination").addClass("pagination-rounded");

            //$('.tree').treegrid({
            //    onChange: function () {
            //        //console.log(begBalSum, curBalSum);
            //    },
            //    onCollapse: function () {
            //        //
            //    },
            //    onExpand: function () {
            //        //
            //    }
            //});
        },
        rowId: "id",
        order: [[0, 'asc'], [7, 'asc']],
        processing: true,
        paging: false,
        scrollX: true,
        scrollY: "50vh",
        scrollCollapse: true,
        select: true,
        searchHighlight: true
    });
    var tbl_module_type = $("#tbl_module_type").DataTable({
        ajax: {
            url: baseUrl + "Module/GetModuleTypes",
            dataSrc: ""
        },
        language: {
            processing: "<div class='text-center'><span class='spinner-border spinner-border-sm'></span> Loading...</div>",
            previous: "<i class='mdi mdi-chevron-left'>",
            next: "<i class='mdi mdi-chevron-right'>"
        },
        columns: [
            {
                data: "id"
            },
            {
                data: "description"
            },
            {
                data: "icon",
                class: "text-center"
            },
            {
                data: "ordinal",
                class: "text-center"
            },
            {
                data: "controller",
                render: function (data, type, row) {
                    return `${row.Controller || ""}/${row.Action || ""}`;
                }
            },
            {
                data: "isDisabled",
                class: "text-center",
                render: function (data, type, row) {
                    return data ? `<span class="fe-x"><label hidden>true</label></span>` : `<span class="fe-check"><label hidden>false</label></span>`;
                }
            },
            {
                data: "isVisible",
                class: "text-center",
                render: function (data, type, row) {
                    return data ? `<span class="fe-eye"><label hidden>true</label></span>` : `<span class="fe-eye-off"><label hidden>false</label></span>`;
                }
            },
            {
                data: "inMaintainance",
                class: "text-center",
                render: function (data, type, row) {
                    return data ? `<span class="fe-check"><label hidden>true</label></span>` : `<span class="fe-x"><label hidden>true</label></span>`;
                }
            }

        ],
        drawCallback: function () {
            $(".dataTables_paginate > .pagination").addClass("pagination-rounded")
        },
        rowId: "id",
        order: [[3, "asc"]],
        processing: true,
        paging: false,
        scrollX: true,
        scrollY: "50vh",
        scrollCollapse: true,
        select: true
    });

    $("#tbl_modules_filter, #tbl_modules_length").hide();
    $("#tbl_module_type_filter, #tbl_module_type_length").hide();

    //#endregion

    //#region Events

    tbl_modules.on('select deselect draw', function () {
        var all = tbl_modules.rows({ search: 'applied' }).count();
        var selectedRows = tbl_modules.rows({ selected: true, search: 'applied' }).count();
        var Id = tbl_modules.rows({ selected: true }).data().pluck("id").toArray().toString();
        var ModuleDesc = tbl_modules.rows({ selected: true }).data().pluck("description").toArray().toString();

        $("#btn_edit").attr({
            "disabled": !(selectedRows === 1),
            "data-id": Id
        });

        $("#btn_copy").attr({
            "disabled": !(selectedRows === 1),
            "data-id": Id
        });

        $("#btn_delete").attr({
            "disabled": !(selectedRows >= 1),
            "data-id": Id,
            "data-module-desc": ModuleDesc
        });
    });

    tbl_module_type.on('select deselect draw', function () {
        var all = tbl_module_type.rows({ search: 'applied' }).count();
        var selectedRows = tbl_module_type.rows({ selected: true, search: 'applied' }).count();
        var Id = tbl_module_type.rows({ selected: true }).data().pluck("id").toArray().toString();
        var Description = tbl_module_type.rows({ selected: true }).data().pluck("description").toArray().toString();

        $("#btn_edit_module_type").attr({
            "disabled": !(selectedRows === 1),
            "data-id": Id
        });

        $("#btn_delete_module_type").attr({
            "disabled": !(selectedRows >= 1),
            "data-id": Id,
            "data-desc": Description
        });
    });

    $(document).on('click', '.btn_remove_stage', function (e) {
        e.preventDefault();
        $(this).closest('.stage_row').remove();
        fixElementSequence(".stage_row");
        rebindValidators();
    });

    $('#txt_search').on('input', function () {
        tbl_modules.search(this.value).draw();
    });

    $('#txt_search_module_type').on('input', function () {
        tbl_module_type.search(this.value).draw();
    });

    $("[name='Module.Icon']").on("input change blur", function () {
        $("#txt_module_icon").html($(this).val());
    });

    $("[name='ModuleType.Icon']").on("input change blur", function () {
        $("#txt_module_type_icon").html($(this).val());
    });

    $("#btn_save_module").click(function () {
        $("#frm_module").submit();
    });

    $("#btn_add").click(function () {
        openModuleModal()
    });

    $("#btn_edit").click(function () {
        openModuleModal($(this).attr("data-id"))
    });

    $("#btn_copy").click(function () {
        openModuleModal($(this).attr("data-id"), "copy")
    });

    $("#btn_delete").click(function () {
        var ModuleIds = $(this).attr("data-id");
        var ModuleDesc = $(this).attr("data-module-desc");

        Swal.fire({
            title: 'Are you sure?',
            text: `The following Module/s will be deleted: ${ModuleDesc}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Confirm',
            showLoaderOnConfirm: true,
            preConfirm: (login) => {
                return fetch(`${baseUrl}Module/DeleteModules/`,
                    {
                        method: "DELETE",
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `moduleIds=${ModuleIds}`
                    })
                    //.then(res => console.log(res));
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(response.statusText)
                        }
                        return response;
                    })
                    .catch(error => {
                        //alertMessage(error, "error");
                        Swal.showValidationMessage(
                            `Request failed: ${error}`
                        )
                    })
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) {
                messageBox("Module(s) successfully deleted.", "success");
                tbl_modules.ajax.reload(null, false)
            }
        })
    });

    $("#btn_refresh").click(function () {
        tbl_modules.ajax.reload(null, false)
    });

    $("#btn_add_module_type").click(function () {
        openModuleTypeModal();
    });

    $("#btn_edit_module_type").click(function () {
        var id = $(this).attr("data-id");
        openModuleTypeModal(id);
    });

    $("#btn_delete_module_type").click(function () {
        var ModuleTypeIds = $(this).attr("data-id");
        var ModuleTypeDesc = $(this).attr("data-desc");

        Swal.fire({
            title: 'Are you sure?',
            text: `The following Module/s will be deleted: ${ModuleTypeDesc}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Confirm',
            showLoaderOnConfirm: true,
            preConfirm: (login) => {
                return fetch(`${baseUrl}Module/DeleteModuleTypes/`,
                    {
                        method: "DELETE",
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `moduleTypeIds=${ModuleTypeIds}`
                    })
                    //.then(res => console.log(res));
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(response.statusText)
                        }
                        return response;
                    })
                    .catch(error => {
                        //alertMessage(error, "error");
                        Swal.showValidationMessage(
                            `Request failed: ${error.responseText}`
                        )
                    })
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) {
                messageBox("Module(s) successfully deleted.", "success");
                tbl_module_type.ajax.reload(null, false)
            }
        })
    });

    $("#btn_refresh_module_type").click(function () {
        tbl_module_type.ajax.reload(null, false)
    });

    $("#btn_add_module_stage").click(function () {
        addModuleStage();
        fixElementSequence(".stage_row");
        rebindValidators();
    });

    $("#frm_moduleType").submit(function (e) {
        e.preventDefault();

        if ($(this).valid()) {
            let button = $("#btn_save_module_type");
            let formData = $(this).serialize();
            formData = formData.replaceAll("ModuleType.", "");
            $.ajax({
                url: $(this).attr("action"),
                method: $(this).attr("method"),
                data: formData,
                beforeSend: function () {
                    button.html("<span class='spinner-border spinner-border-sm'></span> Saving").attr({ disabled: true });
                },
                success: function () {
                    let successMessage = $("[name='ModuleType.Id']").val() ? "Added" : "Updated";
                    tbl_module_type.ajax.reload(null, false)
                    messageBox(`Module Type Successfully ${successMessage}`, "success", true);

                    button.html("<span class='fas fa-save'></span> Save").attr({ disabled: false });
                },
                error: function (response) {
                    messageBox(response.responseText, "danger", true);
                    button.html("<span class='fas fa-save'></span> Save").attr({ disabled: false });
                }
            })
        }
    });

    //#endregion

    //#region Methods

    function rebindValidators() {
        let $form = $("#frm_module");
        $form.unbind();
        $form.data("validator", null);
        $.validator.unobtrusive.parse($form);
        $form.validate($form.data("unobtrusiveValidation").options);
        $form.data("validator").settings.ignore = "";

        $form.submit(function (e) {
            e.preventDefault();
            let formData = $(this).serialize();
            button = $("#btn_save_module");

            if ($(this).valid() == false) {
                messageBox("Please fill up all required fields!", "danger");
                return;
            }

            if (customValidateForm() == false) return;

            $.ajax({
                url: $(this).attr("action"),
                method: $(this).attr("method"),
                data: formData,
                beforeSend: function () {
                    button.html("<span class='spinner-border spinner-border-sm'></span> Saving...");
                    button.attr({ disabled: true });
                },
                success: function (response) {
                    let successMessage = $("input[name='Module.Id']").val() == 0 ? "Module Successfully Added!" : "Module Successfully Updated!";
                    messageBox(successMessage, "success", true);
                    tbl_modules.ajax.reload(null, false)
                    button.attr({ disabled: false });
                    button.html("<span class='fa fa-save'></span> Save");
                },
                error: function (response) {
                    messageBox(response.responseText, "danger", true);
                    button.html("<span class='fa fa-save'></span> Save");
                    button.attr({ disabled: false });
                }
            });
        });
    }

    function customValidateForm() {
        let toValidate = [];
        let message = "";
        let stagesLength = $(".stage_row").length;
        let parentModuleId = $("#Module_ParentModuleId").val();

        //if (stagesLength == 0 && (parentModuleId == 0 || parentModuleId == "")) {
        //    toValidate.push("Module Stage is required please add atleast 1");
        //}

        for (var i = 0; i < toValidate.length; i++) {
            if (i == 0) {
                message += toValidate[i];
            } else {
                message += ", " + toValidate[i];
            }
        }

        if (toValidate.length > 0) {
            messageBox("Please fill up the following fields: " + message, "danger");
            return false;
        }

        return true;
    }

    function openModuleTypeModal(id = 0, mode = "") {
        let moduleTypeModal = $("#moduleType-modal");
        let moduleTypeModalLabel = $("#moduleType-modalLabel");
        let moduleTypeModalOverlay = $("#moduleType-modalOverlay");

        if (id == 0) {
            moduleTypeModalLabel.html("<span class='fas fa-plus'></span> Add Module Type");
            $("[name='ModuleType.Id']").val(0);
            $("[name='ModuleType.Ordinal']").val(0);
            $("[name='ModuleType.Controller']").val("");
            $("[name='ModuleType.Action']").val("");
            $("[name='ModuleType.IsDisabled']").prop("checked", false);
            $("[name='ModuleType.IsVisible']").prop("checked", true);
            $("[name='ModuleType.InMaintenance']").prop("checked", false);
        } else {
            moduleTypeModalLabel.html("<span class='fas fa-edit'></span> Edit Module Type");
            $.ajax({
                url: baseUrl + "Module/GetModuleType/" + id,
                beforeSend: function () {
                    moduleTypeModalOverlay.attr({ hidden: false });
                },
                success: function (response) {
                    if (mode === "copy")
                        $("[name='ModuleType.Id']").val(0);
                    else
                        $("[name='ModuleType.Id']").val(id);

                    $("[name='ModuleType.Description']").val(response.description);
                    $("[name='ModuleType.Ordinal']").val(response.ordinal);
                    $("[name='ModuleType.Controller']").val(response.controller);
                    $("[name='ModuleType.Action']").val(response.Action);
                    $("[name='ModuleType.IsDisabled']").prop("checked", response.isDisabled);
                    $("[name='ModuleType.IsVisible']").prop("checked", response.isVisible);
                    $("[name='ModuleType.InMaintenance']").prop("checked", response.inMaintenance);
                    $("[name='ModuleType.Icon']").val(response.Icon).trigger("change");
                    moduleTypeModalOverlay.attr({ hidden: true });
                },
                error: function (response) {
                    messageBox("Error loading info!", error);
                    moduleTypeModalOverlay.attr({ hidden: true });
                }
            });
        }

        moduleTypeModal.modal("show");
    }

    function openModuleModal(Id = 0, mode = "") {
        let moduleModal = $("#module-modal");
        let moduleModalLabel = $("#module-modalLabel");
        let modalTitle = "";

        if (Id === 0) {
            modalTitle = "<span class='fas fa-plus'></span> Add Module";
            $("[name='Module.Id']").val(0);
            $("[name='Module.Code']").val("");
            $("[name='Module.Description']").val("");
            $("[name='Module.ModuleTypeId']").data('selectize').setValue("");
            $("[name='Module.ApprovalRouteTypeId']").data('selectize').setValue("");
            $("[name='Module.Controller']").val("");
            $("[name='Module.Action']").val("");
            $("[name='Module.Icon']").val("").trigger("change");

            $("[name='Module.ParentModuleId']").data('selectize').setValue("");
            $("[name='Module.Ordinal']").val("");
            $("[name='Module.IsDisabled']").prop("checked", false);
            $("[name='Module.IsVisible']").prop("checked", true);
            $("[name='Module.InMaintenance']").prop("checked", false);
        } else {
            if (mode == "copy") {
                $("[name='Module.Id']").val(0);
                modalTitle = "<span class='fas fa-plus'></span> Add Module";
            } else {
                $("[name='Module.Id']").val(Id);
                modalTitle = "<span class='fas fa-edit'></span> Edit Module";
            }

            $.ajax({
                url: baseUrl + "Module/GetModule/" + Id,
                success: function (response) {
                    $("[name='Module.Code']").val(response.code);
                    $("[name='Module.Description']").val(response.description);
                    $("[name='Module.ModuleTypeId']").data('selectize').setValue(response.moduleTypeId);
                    $("[name='Module.ApprovalRouteTypeId']").data('selectize').setValue(response.approvalRouteTypeId);
                    $("[name='Module.Controller']").val(response.controller);
                    $("[name='Module.Action']").val(response.action);
                    $("[name='Module.Icon']").val(response.icon).trigger("change");

                    parentModuleDropdown.on('load', function (options) {
                        parentModuleDropdown.setValue(response.parentModuleId);
                    });

                    $("[name='Module.Ordinal']").val(response.Ordinal);
                    $("[name='Module.IsDisabled']").prop("checked", response.isEnabled);
                    $("[name='Module.IsVisible']").prop("checked", response.isVisible);
                    $("[name='Module.InMaintenance']").prop("checked", response.inMaintenance);
                }
            });

            $.ajax({
                url: baseUrl + "Module/GetModuleStages/" + Id,
                success: function (response) {
                    $("#tbl_module_stages tbody").empty();
                    for (var stages of response) {
                        addModuleStage(stages);
                    }
                    rebindValidators();
                }
            });
        }

        moduleModalLabel.html(modalTitle);

        moduleModal.modal("show");
    }

    function addModuleStage(stagesObj = {}) {
        let count = $(".stage_row").length;

        let rowToAdd = `<tr class="stage_row">
                            <td hidden="">
                                <input id="ModuleStages_Id_[${count}]" type="number" data-val="true" data-val-required="The Id field is required." name="ModuleStages[${count}].Id" value="${stagesObj.id || 0}">
                                <input id="ModuleStages_Level_[${count}]" type="number" data-val="true" data-val-required="The Level field is required." name="ModuleStages[${count}].Level" value="${stagesObj.level || 0}">
                                <input id="ModuleStages_ModuleId_[${count}]" type="number" data-val="true" data-val-required="The ModuleId field is required." name="ModuleStages[${count}].ModuleId" value="${stagesObj.moduleId || 0}">
                                <input id="ModuleStages_Code_[${count}" class="form-control-plaintext form-control-sm" type="text" name="ModuleStages[${count}].Code" value="${stagesObj.code || ""}">
                            </td>
                            <td class="text-center align-middle">
                                <span class="d-flex justify-content-between ui-widget-header ui-sortable-handle" style="cursor: move;display: inline-block;">
                                    <i class="fas fa-ellipsis-v"></i>
                                    <i class="fas fa-ellipsis-v"></i>
                                </span>
                            </td>
                            <td class="text-center">
                                <button class="btn btn-soft-danger btn-xs btn_remove_stage" type="button">
                                    <span class="fa fa-times"></span>
                                </button>
                            </td>
                            <td>
                                <input class="form-control form-control-sm" placeholder="Stage Name" id="ModuleStages_Name_[${count}]" type="text" data-val="true" data-val-required="Enter Stage Name" name="ModuleStages[${count}].Name" value="${stagesObj.name || ""}" aria-describedby="ModuleStages_StageName_[${count}]-error" aria-invalid="false">
                                <span class="field-validation-valid text-danger" data-valmsg-for="ModuleStages[${count}].Name" data-valmsg-replace="true"></span>
                            </td>
                            <td>
                                <input class="form-control form-control-sm" placeholder="Stage Title" id="ModuleStages_Title_[${count}]" type="text" data-val="true" data-val-required="Enter Stage Name" name="ModuleStages[${count}].Title" value="${stagesObj.title || ""}" aria-describedby="ModuleStages_Title_[${count}]-error" aria-invalid="false">
                                <span class="field-validation-valid text-danger" data-valmsg-for="ModuleStages[${count}].Title" data-valmsg-replace="true"></span>
                            </td>
                            <td>
                                <input class="form-control form-control-sm numberInputMask" id="ModuleStages_ReturnStage_[${count}]" type="text" data-val="true" data-val-required="Enter Return Stage" name="ModuleStages[${count}].ReturnStage" value="${stagesObj.returnStage || 0}">
                                <span class="field-validation-valid text-danger" data-valmsg-for="ModuleStages[${count}].ReturnStage" data-valmsg-replace="true"></span>
                            </td>
                            <td>
                                <input class="form-control form-control-sm" placeholder="Approve Description" id="ModuleStages_ApproveDesc_[${count}]" type="text" data-val="true" data-val-required="Enter Approved Description" name="ModuleStages[${count}].ApproveDesc" value="${stagesObj.approveDesc || ""}">
                                <span class="field-validation-valid text-danger" data-valmsg-for="ModuleStages[${count}].ApproveDesc" data-valmsg-replace="true"></span>
                            </td>
                            <td>
                                <input class="form-control form-control-sm" placeholder="Reject Description" id="ModuleStages_RejectDesc_[${count}]" type="text" data-val="true" data-val-required="Enter Rejected Description" name="ModuleStages[${count}].RejectDesc" value="${stagesObj.rejectDesc || ""}">
                                <span class="field-validation-valid text-danger" data-valmsg-for="ModuleStages[${count}].RejectDesc" data-valmsg-replace="true"></span>
                            </td>
                            <td>
                                <input class="form-control form-control-sm numberInputMask" id="ModuleStages_RequiredCount_[${count}]" type="text" data-val="true" data-val-required="The Required Approver Count field is required." name="ModuleStages[${count}].RequiredCount" value="${stagesObj.requiredCount || 1}">
                                <span class="field-validation-valid text-danger" data-valmsg-for="ModuleStages[${count}].RequiredCount" data-valmsg-replace="true"></span>
                            </td>
                            <td>
                                <div class="form-group form-group-sm">
                                    <select class="form-control form-control-sm" id="ModuleStages_ApproverId_[${count}]" type="text" data-val="true" data-val-required="The Required Approver." name="ModuleStages[${count}].ApproverId">
                                        <option value="">Select Approver...</option>
                                    </select>
                                </div>
                                <span class="field-validation-valid text-danger" data-valmsg-for="ModuleStages[${count}].ApproverId" data-valmsg-replace="true"></span>
                            </td>
                        </tr>`;

        $("#tbl_module_stages tbody").append(rowToAdd);

        $(".numberInputMask").inputmask({
            alias: 'decimal',
            rightAlign: true,
            digits: 0,
            allowMinus: false,
            autoGroup: true,
            placeholder: "0"
        });

        var approverIdDropdown, $approverIdDropdown;

        $approverIdDropdown = $(`[id="ModuleStages_ApproverId_[${count}]"]`).selectize({
            valueField: 'Id',
            labelField: 'UserName',
            searchField: ['UserName', 'Name'],
            preload: true,
            load: function (query, callback) {
                $.ajax({
                    url: baseUrl + "Account/GetUsers",
                    success: function (results) {
                        try {
                            callback(results);
                        } catch (e) {
                            callback();
                        }
                    },
                    error: function () {
                        callback();
                    }
                });
            },
            render: {
                item: function (item, escape) {
                    return ("<div class='text-truncate' style='max-width:90%;'>" +
                        escape(item.userName) + " <span class='text-muted'>(" + escape(item.name) + ")</span>" +
                        "</div>"
                    );
                },
                option: function (item, escape) {
                    return ("<div class='py-1 px-2'>" +
                        escape(item.userName) + " <span class='text-muted'>(" + escape(item.name) + ")</span>" +
                        "</div>"
                    );
                }
            }
        });

        approverIdDropdown = $approverIdDropdown[0].selectize;

        approverIdDropdown.on('load', function () {
            approverIdDropdown.setValue(stagesObj.ApproverId);
            approverIdDropdown.off('load');
        });
    }

    //#endregion
});



function loadModules() {

    var module = [];
    var moduleGroups = [];
    var parentModules = [];
    var subModules = [];

    var elementToAdd = `
                <div class="topnav">
                    <div class="container-fluid">
                        <nav class="navbar navbar-light navbar-expand-lg topnav-menu">
                            <div class="collapse navbar-collapse" id="topnav-menu-content">
                                <ul class="navbar-nav">
                                    <li class="nav-item">
                                        <a class="nav-link" asp-controller="Home" asp-action="Index">
                                            <i class="fe-airplay me-1"></i> Dashboard
                                        </a>
                                    </li>`;
    for (var moduleGroup of moduleGroups) {
        elementToAdd += `<li class="nav-item dropdown">
                                            <a class="nav-link dropdown-toggle arrow-none" href="#" id="topnav-apps" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                ${moduleGroup.ModuleTypeIcon} ${moduleGroup.ModuleType} <div class="arrow-down"></div>
                                            </a>
                                            <div class="dropdown-menu" aria-labelledby="topnav-apps">`;
        for (var parentModule of parentModules) {
            if (parentModule.ModuleType == moduleGroup.ModuleType) {
                if (parentModule.HasSubModule) {
                    elementToAdd += `<div class="dropdown">
                                                                <a class="dropdown-item dropdown-toggle arrow-none ${parentModule.InMaintenance ? "disabled" : ""}" asp-controller="${parentModule.ModuleController}" asp-action="${parentModule.ModuleAction}" id="topnav-extendedui" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                                    ${parentModule.ModuleIcon} ${parentModule.ModuleName} <div class="arrow-down"></div>
                                                                </a>
                                                                <div class="dropdown-menu" aria-labelledby="topnav-extendedui">`;
                    for (var subModule of subModules) {
                        if (subModule.ParentModuleId == parentModule.ModuleId) {
                            elementToAdd += `<a href="${baseUrl}${subModule.ModuleController}/${subModule.ModuleAction}" class="dropdown-item ${parentModule.InMaintenance ? "disabled" : ""}">${subModule.ModuleIcon} ${subModule.ModuleName}</a>`;
                        }
                    }
                    elementToAdd += `
                                                                </div>
                                                            </div>`;
                }
                else {
                    elementToAdd += `<a href="${baseUrl}${parentModule.ModuleController}/${parentModule.ModuleAction}" class="dropdown-item ${parentModule.InMaintenance ? "disabled" : ""}">
                                                                ${parentModule.ModuleIcon}
                                                                ${parentModule.ModuleName}
                                                                <span class="badge bg-soft-danger text-danger" id="span_${parentModule.ModuleCode}" hidden>New</span>
                                                            </a>`;
                }
            }
        }
        elementToAdd += `                           </div>
                                        </li>`;
    }

    elementToAdd += `</ul>
                            </div>
                        </nav>
                    </div>
                </div>`;
}