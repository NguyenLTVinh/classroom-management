$(document).ready(function() {
  // Function to get the current school year
  function getCurrentSchoolYear() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    return currentMonth >= 8 ? currentYear : currentYear - 1;
  }

  // Populate the school year dropdown
  const currentSchoolYear = getCurrentSchoolYear();
  for (let year = 2019; year <= currentSchoolYear + 1; year++) {
    $('#year-select').append(new Option(year, year, year === currentSchoolYear));
  }

  // Function to load data based on filters
  function loadData(year, block, className) {
      $.ajax({
          url: '/api/index',
          data: { year: year, block: block, className: className },
          success: function(response) {
              const $tbody = $('#data-table tbody').empty();
              if (response.students.length) {
                  response.students.forEach(student => {
                      const row = `<tr>
                          <td>${student.name}</td>
                          <td>${student.class}</td>
                          <td>${student.gender}</td>
                          <td>${student.birthday}</td>
                          <td>${student.email1}</td>
                          <td>${student.email2 || ''}</td>
                      </tr>`;
                      $tbody.append(row);
                  });
              } else {
                  $tbody.append('<tr><td colspan="6">No data available</td></tr>');
              }
          }
      });
  }

  // Populate the class blocks based on the selected school year
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
    loadData(selectedYear, '', ''); // Load data on year change
  });

  // Populate the class names based on the selected school year and class block
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
    loadData(selectedYear, selectedBlock, ''); // Load data on block change
  });

  $('#year-select').change();

  $('#year-select, #block-select, #class-select').change(function() {
    const selectedYear = $('#year-select').val();
    const selectedBlock = $('#block-select').val();
    const selectedClass = $('#class-select').val();
    loadData(selectedYear, selectedBlock, selectedClass); // Load data on class change
  });

  // Load initial data
  loadData(currentSchoolYear, '', '');
});
