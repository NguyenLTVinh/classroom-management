$(document).ready(function() {
    function getCurrentSchoolYear() {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      return currentMonth >= 8 ? currentYear : currentYear - 1;
    }
  
    const currentSchoolYear = getCurrentSchoolYear();
    for (let year = 2019; year <= currentSchoolYear + 1; year++) {
      $('#year-select').append(new Option(year, year, year === currentSchoolYear));
    }
  
    $('#year-select').change(function() {
      const selectedYear = $(this).val();
      $.ajax({
        url: '/api/getClassBlocks',
        data: { year: selectedYear },
        success: function(blocks) {
          $('#block-select').empty().append(new Option('All Blocks', ''));
          blocks.forEach(block => {
            $('#block-select').append(new Option(block, block));
          });
        }
      });
    });
  
    $('#block-select').change(function() {
      const selectedYear = $('#year-select').val();
      const selectedBlock = $(this).val();
      $.ajax({
        url: '/api/getClassNames',
        data: { year: selectedYear, block: selectedBlock },
        success: function(classes) {
          $('#class-select').empty().append(new Option('All Classes', ''));
          classes.forEach(className => {
            $('#class-select').append(new Option(className, className));
          });
        }
      });
    });
  
    $('#class-select').change(function() {
      const selectedYear = $('#year-select').val();
      const selectedBlock = $('#block-select').val();
      const selectedClass = $(this).val();
      $.ajax({
        url: '/api/students',
        data: { className: selectedClass },
        success: function(students) {
          $('#student-select').empty().append(new Option('All Students', ''));
          students.forEach(student => {
            $('#student-select').append(new Option(student.name, student.email1));
          });
        }
      });
    });
  
    $('#year-select, #block-select, #class-select, #student-select').change(function() {
      const selectedYear = $('#year-select').val();
      const selectedBlock = $('#block-select').val();
      const selectedClass = $('#class-select').val();
      const selectedEmail = $('#student-select').val();
      $.ajax({
        url: '/api/grades',
        data: { year: selectedYear, block: selectedBlock, className: selectedClass, studentEmail: selectedEmail },
        dataType: 'json',
        success: function(response) {
          const hk1Table = $('#hk1-table tbody').empty();
          const hk2Table = $('#hk2-table tbody').empty();
  
          if (response.HK1.length) {
            response.HK1.forEach(student => {
              let row = `<tr>
                <td>${student.name}</td>
                <td>${student.email1}</td>`;
              ['Toán', 'Tiếng Anh', 'Ngữ Văn', 'GDCD', 'Tin học', 'LS & ĐL', 'Khoa học tự nhiên', 'GDTC', 'Nghệ thuật', 'Nội dung giáo dục của địa phương'].forEach(subject => {
                row += `<td>${student.grades[subject] || ''}</td>`;
              });
              row += `</tr>`;
              hk1Table.append(row);
            });
          } else {
            hk1Table.append('<tr><td colspan="12">No data available</td></tr>');
          }
  
          if (response.HK2.length) {
            response.HK2.forEach(student => {
              let row = `<tr>
                <td>${student.name}</td>
                <td>${student.email1}</td>`;
              ['Toán', 'Tiếng Anh', 'Ngữ Văn', 'GDCD', 'Tin học', 'LS & ĐL', 'Khoa học tự nhiên', 'GDTC', 'Nghệ thuật', 'Nội dung giáo dục của địa phương'].forEach(subject => {
                row += `<td>${student.grades[subject] || ''}</td>`;
              });
              row += `</tr>`;
              hk2Table.append(row);
            });
          } else {
            hk2Table.append('<tr><td colspan="12">No data available</td></tr>');
          }
        }
      });
    });
  
    $('#year-select').trigger('change');
  });
  