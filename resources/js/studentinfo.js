document.addEventListener('DOMContentLoaded', function() {
    const scores = JSON.parse(document.getElementById('selfAssessmentData').textContent);
    const studentGrades = JSON.parse(document.getElementById('studentGradesData').textContent);
    const classGrades = JSON.parse(document.getElementById('classGradesData').textContent);
    // Bar Chart for Self Assessment
    const ctxBar = document.getElementById('selfAssessmentChart').getContext('2d');
    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['Trung Thực', 'Tôn Trọng', 'Kỉ Luật Bản Thân'],
            datasets: [{
                data: [scores.honesty * 20, scores.respect * 20, scores.discipline * 20],
                backgroundColor: 'rgba(54, 162, 235, 1)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                barThickness: 50,
            }]
        },
        options: {
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });

    // Radar Chart for Additional Skills
    const ctxRadar = document.getElementById('skillsRadarChart').getContext('2d');
    new Chart(ctxRadar, {
        type: 'radar',
        data: {
            labels: ['Giao Tiếp', 'Học Cách Học', 'Phát Triển Cảm Xúc', 'Trách Nhiệm Với Tập Thể', 'Giải Quyết Vấn Đề'],
            datasets: [{
                data: [
                    scores.communication * 20, 
                    scores.learning * 20, 
                    scores.emotional * 20, 
                    scores.responsibility * 20, 
                    scores.problemsolving * 20
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });

    const subjects = ['Toán', 'Ngữ Văn', 'Khoa học tự nhiên', 'LS & ĐL', 'Công nghệ', 'Tin học', 'GDCD', 'Tiếng Anh'];
    const termLabels = ['Cá Nhân HK1', 'Trung Bình Lớp HK1', 'Cá Nhân HK2', 'Trung Bình Lớp HK2'];
    const colors = ['rgba(54, 162, 235, 1)', 'rgba(255, 159, 64, 1)', 'rgba(201, 203, 207, 1)', 'rgba(255, 205, 86, 1)'];

    const data = {
        labels: subjects,
        datasets: [
            {
                label: 'Cá Nhân HK1',
                backgroundColor: colors[0],
                borderColor: colors[0],
                borderWidth: 1,
                data: subjects.map(subject => studentGrades.HK1[subject] || 0)
            },
            {
                label: 'Trung Bình Lớp HK1',
                backgroundColor: colors[1],
                borderColor: colors[1],
                borderWidth: 1,
                data: subjects.map(subject => classGrades.HK1[subject] || 0)
            },
            {
                label: 'Cá Nhân HK2',
                backgroundColor: colors[2],
                borderColor: colors[2],
                borderWidth: 1,
                data: subjects.map(subject => studentGrades.HK2[subject] || 0)
            },
            {
                label: 'Trung Bình Lớp HK2',
                backgroundColor: colors[3],
                borderColor: colors[3],
                borderWidth: 1,
                data: subjects.map(subject => classGrades.HK2[subject] || 0)
            }
        ]
    };

    const ctx = document.getElementById('gradesChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10
                }
            }
        }
    });
    
    // Populate the table with grades
    const table = document.getElementById('gradesTable');
    subjects.forEach(subject => {
        const row = table.insertRow();
        row.insertCell(0).innerText = subject;
        row.insertCell(1).innerText = studentGrades.HK1[subject] || '-';
        row.insertCell(2).innerText = classGrades.HK1[subject] || '-';
        row.insertCell(3).innerText = studentGrades.HK2[subject] || '-';
        row.insertCell(4).innerText = classGrades.HK2[subject] || '-';
    });
});
