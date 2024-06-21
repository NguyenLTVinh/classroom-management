$(document).ready(function() {
    $('#class-select').on('change', function() {
        var selectedClass = $(this).val();
        $.ajax({
            url: '/',
            type: 'GET',
            data: { className: selectedClass },
            success: function(data) {
                var tbody = $('#data-table tbody');
                tbody.empty();
                if (data.students && data.students.length > 0) {
                    data.students.forEach(function(row) {
                        var tr = $('<tr>');
                        tr.append('<td>' + row.number + '</td>');
                        tr.append('<td>' + row.name + '</td>');
                        tr.append('<td>' + row.gender + '</td>');
                        tr.append('<td>' + row.birthday + '</td>');
                        tr.append('<td>' + row.email1 + '</td>');
                        tr.append('<td>' + (row.email2 || '') + '</td>');
                        tbody.append(tr);
                    });
                } else {
                    tbody.append('<tr><td colspan="6">No data available</td></tr>');
                }
            },
            error: function() {
                alert('Error fetching data');
            }
        });
    });
});
