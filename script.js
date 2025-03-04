document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container');
    const screens = document.querySelectorAll('.screen');
    
    let currentScreen = 0;
    const totalScreens = screens.length;

    // Initialize D3 visualizations
    initializeVisualizations();

    // Handle keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown' || e.key === ' ') {
            navigateNext();
        } else if (e.key === 'ArrowUp') {
            navigatePrev();
        }
    });

    // Handle wheel/scroll events
    let isScrolling = false;
    document.addEventListener('wheel', function(e) {
        if (isScrolling) return;
        
        isScrolling = true;
        setTimeout(() => { isScrolling = false; }, 800); // Debounce scrolling
        
        if (e.deltaY > 0) {
            navigateNext();
        } else {
            navigatePrev();
        }
    }, { passive: true });

    // Navigation functions
    function navigateNext() {
        if (currentScreen < totalScreens - 1) {
            currentScreen++;
            scrollToScreen(currentScreen);
        }
    }

    function navigatePrev() {
        if (currentScreen > 0) {
            currentScreen--;
            scrollToScreen(currentScreen);
        }
    }

    function scrollToScreen(index) {
        screens[index].scrollIntoView({ behavior: 'smooth' });
    }

    // Initialize D3 visualizations
    function initializeVisualizations() {
        // Load the CSV data
        d3.csv("final_data.csv").then(data => {
            // Convert unix time to Date objects and heart rate to numbers
            data.forEach(d => {
                d.unix = +d.unix;
                d.heart_rate_bpm = +d.heart_rate_bpm;
            });

            // Set up the initial chart
            updateChart(data, 'S1', 'Midterm 1');

            // Add event listeners to the dropdowns
            d3.select("#student-select").on("change", function() {
                const selectedStudent = this.value;
                const selectedExam = d3.select("#exam-select").node().value;
                updateChart(data, selectedStudent, selectedExam);
            });

            d3.select("#exam-select").on("change", function() {
                const selectedExam = this.value;
                const selectedStudent = d3.select("#student-select").node().value;
                updateChart(data, selectedStudent, selectedExam);
            });
        }).catch(error => {
            console.error("Error loading the CSV data:", error);
        });
    }

    function updateChart(data, student, exam) {
        // Filter the data for the selected student and exam
        const filteredData = data.filter(d => d.student_id === student && d.exam_name === exam);

        // Clear the previous chart
        d3.select("#viz1").selectAll("*").remove();

        // Set up the SVG dimensions
        const margin = { top: 50, right: 30, bottom: 50, left: 50 };
        const width = document.getElementById('viz1').clientWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = d3.select("#viz1")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Set up the scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(filteredData, d => d.unix))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.heart_rate_bpm)])
            .range([height, 0]);

        // Add the X axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format("d")))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("fill", "#000")
            .attr("text-anchor", "middle")
            .text("Unix Time (Seconds)");

        // Add the Y axis
        svg.append("g")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -height / 2)
            .attr("fill", "#000")
            .attr("text-anchor", "middle")
            .text("Heart Rate (BPM)");

        // Add the line
        svg.append("path")
            .datum(filteredData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1)
            .attr("d", d3.line()
                .x(d => xScale(d.unix))
                .y(d => yScale(d.heart_rate_bpm))
            );

        // Add the title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .text(`Heart Rate Over Time for ${student} for ${exam}`);
    }
});