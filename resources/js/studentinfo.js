document.addEventListener('DOMContentLoaded', function() {
    const scores = JSON.parse(document.getElementById('selfAssessmentData').textContent);
    // const studentGrades = JSON.parse(document.getElementById('studentGradesData').textContent);
    // const classGrades = JSON.parse(document.getElementById('classGradesData').textContent);
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
});
