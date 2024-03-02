<?php
/*
Plugin Name: CSV Data Plugin
Description: Plugin to load CSV data into a table with filters and export functionality.
Version: 1.0
Author: Shoaib Memon
Author URL: https://www.linkedin.com/in/shoaib-memon
*/

function csv_data_plugin_enqueue_scripts() {
    wp_enqueue_script('jquery');

    // Enqueue Papa Parse library
    wp_enqueue_script('papaparse', 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js', array(), '5.3.0', true);

    // Enqueue Select2 library
    wp_enqueue_script('select2', 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.1.0-beta.1/js/select2.min.js', array('jquery'), '4.1.0-beta.1', true);
    wp_enqueue_style('select2', 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.1.0-beta.1/css/select2.min.css', array(), '4.1.0-beta.1');

    // Enqueue DataTables library
    wp_enqueue_script('datatables', 'https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js', array('jquery'), '1.11.5', true);
    wp_enqueue_style('datatables', 'https://cdn.datatables.net/1.11.5/css/jquery.dataTables.min.css', array(), '1.11.5');

    // Enqueue custom script
    wp_enqueue_script('csv-data-plugin-script', plugin_dir_url(__FILE__) . 'script.js', array('jquery', 'papaparse', 'select2', 'datatables'), '1.0', true);

}
add_action('wp_enqueue_scripts', 'csv_data_plugin_enqueue_scripts');

// Shortcode function to display CSV data table
function csv_data_plugin_shortcode($atts) {
    $atts = shortcode_atts(array(
        'csv_file' => 'Sample-Data-Screener.csv',
    ), $atts);

    // Construct URL for the CSV file
    $csv_url = plugin_dir_url(__FILE__) . $atts['csv_file'];

    ob_start();
    ?>
    <div class="container-fluid mt-3 custom-export-filter-container" style="background-color: #191970; padding: 30px; border-radius: 10px; border: 1px solid #ffffff">
        <div class="row">
            <div class="export-filter-container d-flex justify-content-between align-items-center" style="width: 100%;">
                <div>
                    <div id="filter-container"></div>
                    <button id="add-filter-btn" class="btn btn-success mt-5">Add Filter</button>
                    <button id="export-btn" class="btn btn-primary mt-5" style="margin-left: 15px">Export CSV</button>
                </div>
            </div>
        </div>
    </div>
        <div class="container-fluid mt-3" style="background-color: #f0f8ff; padding: 30px; border-radius: 10px; border: 1px solid #111111">
            <div class="row">
                <div class="col-12">
                    <div class="table-responsive">
                        <table id="csv-table" class="table table-striped table-bordered" data-csv-url="<?php echo esc_url($csv_url); ?>">
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Ticker</th>
                                    <th>Sector</th>
                                    <th>Industry</th>
                                    <th>Revenue</th>
                                    <th>GP</th>
                                    <th>FCF</th>
                                    <th>Capex</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('csv_data_table', 'csv_data_plugin_shortcode');
?>
