let examData = [];
let timeExtent = [0, 0];
let selectedStudent = "S1";
let isPlaying = false;
let animationTimer = null;
let currentTime = 0; // Track current time for animation

const margin = { top: 40, right: 30, bottom: 50, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

d3.csv("final_data.csv").then(data => {
  // Filter data for Midterm 1
  examData = data.filter(d => d.exam_name === "Midterm 1");

  // Parse timestamps and heart rates
  examData.forEach(d => {
    d.unix = +d.unix;
    d.heart_rate_bpm = +d.heart_rate_bpm;
    d.grade = +d.grade;
  });

  // Set up chart dimensions
  const maxUnixTime = d3.max(examData, d => d.unix); // Get the maximum Unix time across all students
  const xScale = d3.scaleLinear()
    .domain([0, maxUnixTime]) // Set domain from 0 to the maximum Unix time
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([0, 220]) // Fixed y-axis scale from 0 to 220 BPM
    .range([height - margin.bottom, margin.top]);

  // Create SVG element for the chart
  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add axes
  const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(yScale);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

  svg.append("g")
    .call(yAxis);

  // Add shaded region for resting heart rate (60-100 BPM)
  svg.append("rect")
    .attr("x", margin.left)
    .attr("y", yScale(100))
    .attr("width", width - margin.left - margin.right)
    .attr("height", yScale(60) - yScale(100))
    .attr("fill", "lightblue")
    .attr("opacity", 0.3);

  // Add dashed lines for 60 BPM and 100 BPM
  svg.append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", yScale(60))
    .attr("y2", yScale(60))
    .attr("stroke", "blue")
    .attr("stroke-dasharray", "5,5");

  svg.append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", yScale(100))
    .attr("y2", yScale(100))
    .attr("stroke", "blue")
    .attr("stroke-dasharray", "5,5");

  // Add vertical lines at 4000 and 8000 Unix times
  svg.append("line")
    .attr("x1", xScale(4000))
    .attr("x2", xScale(4000))
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "black")
    .attr("stroke-width", 1);

  svg.append("line")
    .attr("x1", xScale(8000))
    .attr("x2", xScale(8000))
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "black")
    .attr("stroke-width", 1);

  // Add heart rate line
  const heartRateLine = d3.line()
    .x(d => xScale(d.unix))
    .y(d => yScale(d.heart_rate_bpm));

  let heartRatePath = svg.append("path")
    .attr("class", "line")
    .attr("d", heartRateLine([])) // Start with an empty path
    .attr("stroke", "darkblue") // Dark blue line
    .attr("stroke-width", 1.5)
    .attr("fill", "none");

  // Play button functionality
  const playButton = d3.select("#play-button");
  playButton.on("click", () => {
    if (isPlaying) {
      pauseAnimation();
    } else {
      if (playButton.text() === "Restart") {
        resetCharts();
      }
      startAnimation();
    }
  });

  // Update chart when a new student is selected
  d3.select("#student-select").on("change", () => {
    selectedStudent = d3.select("#student-select").property("value");
    resetCharts();
    updateGradeBox(); // Update grade box immediately
  });

  // Function to update chart based on current time
  function updateCharts(currentTime) {
    const studentData = examData.filter(d => d.student_id === selectedStudent);

    // Filter data up to the current time
    const filteredData = studentData.filter(d => d.unix <= currentTime);

    // Update the path
    heartRatePath.attr("d", heartRateLine(filteredData));

    // Update real-time information
    const currentData = filteredData[filteredData.length - 1];
    if (currentData) {
      d3.select("#unix-time").text(currentData.unix);
      d3.select("#heart-rate").text(`${currentData.heart_rate_bpm} BPM`);
    }

    // Check if the animation reaches 4000 or 8000 Unix times
    if (currentTime >= 4000 && !document.getElementById("avg-diff-beginning").textContent.includes("--")) {
      displayAverageDifference(studentData, 0, 4000, "beginning");
    }
    if (currentTime >= 8000 && !document.getElementById("avg-diff-middle").textContent.includes("--")) {
      displayAverageDifference(studentData, 4000, 8000, "middle");
    }
    if (currentTime >= d3.max(studentData, d => d.unix) && !document.getElementById("avg-diff-end").textContent.includes("--")) {
      displayAverageDifference(studentData, 8000, d3.max(studentData, d => d.unix), "end");
    }
  }

  // Function to calculate and display average difference in heart rate
  function displayAverageDifference(data, startTime, endTime, section) {
    const sectionData = data.filter(d => d.unix >= startTime && d.unix <= endTime);
    if (sectionData.length === 0) {
      console.log(`No data for ${section} section for student ${selectedStudent}`);
      return; // Skip if no data in this section
    }

    const avgHeartRate = d3.mean(sectionData, d => d.heart_rate_bpm);
    if (isNaN(avgHeartRate)) {
      console.log(`Invalid average heart rate for ${section} section for student ${selectedStudent}`);
      return; // Skip if average heart rate is NaN
    }

    const restingHeartRate = 80; // Middle of the resting heart rate range (60-100 BPM)
    const avgDifference = (avgHeartRate - restingHeartRate).toFixed(2);

    // Update the corresponding HTML element
    const elementId = `avg-diff-${section}`;
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = `Avg. Diff. Btwn. Actual Heart Rate and Resting Heart Rate: ${avgDifference} BPM`;
    }
  }

  // Function to update grade box
  function updateGradeBox() {
    const studentData = examData.filter(d => d.student_id === selectedStudent);
    const grade = studentData[0].grade; // Get the grade for the selected student
    const gradeBox = d3.select("#grade-box");
    gradeBox.text(`Grade: ${grade}`);

    if (grade >= 85) {
      gradeBox.style("background-color", "lightgreen");
    } else if (grade >= 75) {
      gradeBox.style("background-color", "lightyellow");
    } else {
      gradeBox.style("background-color", "lightcoral");
    }
  }

  // Function to start animation
  function startAnimation() {
    isPlaying = true;
    playButton.text("Pause");

    const startTime = 0;
    const endTime = d3.max(examData, d => d.unix);

    animationTimer = d3.interval(() => {
      currentTime += 200; // Increment time by 200 Unix time units per frame
      if (currentTime >= endTime) {
        pauseAnimation();
        playButton.text("Restart");
      } else {
        updateCharts(currentTime);
      }
    }, 100); // Update every 100ms
  }

  // Function to pause animation
  function pauseAnimation() {
    isPlaying = false;
    playButton.text("Play");
    if (animationTimer) {
      animationTimer.stop();
    }
  }

  // Function to reset charts
  function resetCharts() {
    pauseAnimation();
    currentTime = 0; // Reset current time
    heartRatePath.attr("d", heartRateLine([]));
    d3.select("#unix-time").text("--");
    d3.select("#heart-rate").text("-- BPM");
    playButton.text("Play");
    // Reset average difference text
    document.getElementById("avg-diff-beginning").textContent = "Avg. Diff. Btwn. Actual Heart Rate and Resting Heart Rate: -- BPM";
    document.getElementById("avg-diff-middle").textContent = "Avg. Diff. Btwn. Actual Heart Rate and Resting Heart Rate: -- BPM";
    document.getElementById("avg-diff-end").textContent = "Avg. Diff. Btwn. Actual Heart Rate and Resting Heart Rate: -- BPM";
  }

  // Initialize grade box for the first student
  updateGradeBox();
});