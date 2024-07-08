document.addEventListener('DOMContentLoaded', function() {
    const scores = JSON.parse(document.getElementById('selfAssessmentData').textContent);
    const ctx = document.getElementById('selfAssessmentChart').getContext('2d');
    console.log(scores);
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Trung Thực', 'Tôn Trọng', 'Kỉ Luật Bản Thân'],
            datasets: [{
                data: [scores.honesty, scores.respect, scores.discipline],
                backgroundColor: [
                    'rgba(75, 192, 192, 1)', 
                    'rgba(255, 206, 86, 1)', 
                    'rgba(153, 102, 255, 1)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)', 
                    'rgba(255, 206, 86, 1)', 
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1,
                barThickness: 50,  // Adjust the thickness of the bars
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
                    max: 5
                }
            }
        }
    });
});
