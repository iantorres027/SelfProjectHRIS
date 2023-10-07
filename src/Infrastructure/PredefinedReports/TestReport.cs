namespace Template.Infrastructure.PredefinedReports
{
    public partial class TestReport : DevExpress.XtraReports.UI.XtraReport {
        public TestReport() {
            InitializeComponent();
        }

        private void TestReport_BeforePrint(object sender, System.ComponentModel.CancelEventArgs e)
        {

        }
    }
}