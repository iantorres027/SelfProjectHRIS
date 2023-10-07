$(function () {
    let reportsDiv = $("#reports-div");
    loadReports();

    function loadReports() {
        $.ajax({
            url: "/Report/GetReportList/",
            success: function (data) {
                let reportListData = cleanReportList(data);
                let reportItem = "";
                let reportTypes = ['Main Report', 'Sub Report'];



                for (let report of reportListData) {
                    var reportName = report.name;
                    var reportSubtitle = reportName.substring(reportName.indexOf("("), reportName.indexOf(")") + 1);
                    reportName = reportName.replace(reportSubtitle, '');


                    reportItem += `
                            <div class="col-lg-3">
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="header-title mb-0">${reportName}</h5>
                                        <p class="card-text"></p>
                                    </div>
                                    <div class="card-body">
                                        <a href="/Report/Viewer?reportName=${report.name}" class="card-link text-custom">${localizer("Viewer")}</a>
                                        <a href="/Report/Designer?reportName=${report.name}" class="card-link text-custom">${localizer("Designer")}</a>
                                        ${report.isCustomReport ? `<button data-name="${report.name}" class="btn p-0 text-danger float-end js-delete">${localizer("Delete")}</button>` : ''}
                                    </div>
                                </div>
                            </div>`;
                }



                reportsDiv.empty();
                reportsDiv.append(reportItem);
            }
        });
    }

    $(document).on("click", ".js-delete", function () {
        let reportName = $(this).attr("data-name");

        Swal.fire({
            title: 'Are you sure?',
            text: `The following report will be deleted: ${reportName}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Confirm',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return fetch(`/Report/DeleteReport/`,
                    {
                        method: "DELETE",
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `reportName=${reportName}`
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(response.statusText)
                        }
                        return response;
                    })
                    .catch(error => {
                        Swal.showValidationMessage(
                            `Request failed: ${error}`
                        )
                    })
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) {
                messageBox("Record(s) successfully deleted.", "success", true);
                loadReports();
            }
        })
    });

    function cleanReportList(data) {
        const uniqueData = {};

        for (let item of data) {
            const name = item.name;
            const isCustom = item.isCustomReport;

            if (!(name in uniqueData) || (isCustom && !uniqueData[name].isCustomReport)) {
                uniqueData[name] = item;
            }
        }

        // Return the unique data from the object
        return Object.values(uniqueData);
    }
});