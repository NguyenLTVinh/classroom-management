$(document).ready(function() {
    $('#save-btn').click(function() {
        const attendanceData = [];
        $('#attendance-table tbody tr').each(function() {
            const email = $(this).find('input[name="late"]').data('email');
            const late = $(this).find('input[name="late"]').val();
            const excused = $(this).find('input[name="excused"]').val();
            const unexcused = $(this).find('input[name="unexcused"]').val();
            attendanceData.push({ email, late, excused, unexcused });
        });

        $.ajax({
            url: '/attendance',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ attendance: attendanceData }),
            success: function(response) {
                alert('Attendance data saved successfully');
            },
            error: function(error) {
                alert('Error saving attendance data');
            }
        });
    });
});
