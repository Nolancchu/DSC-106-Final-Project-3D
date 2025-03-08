let examData = [];
let selectedStudent = "S1"; // Default selected student

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

  // Get unique student IDs
  const studentIds = [...new Set(examData.map(d => d.student_id))];
  const buttonWidth = 850 / studentIds.length - 10; // Subtract margin

  // Create buttons for each student
  const buttonContainer = d3.select("#button-container");
  buttonContainer.selectAll("button")
    .data(studentIds)
    .enter()
    .append("button")
    .text(d => d)
    .style("width", `${buttonWidth}px`)
    .on("click", function (event, d) {
      selectedStudent = d; // Update selected student
      updateChart(); // Update the chart immediately
      updateGradeBox(); // Update grade box
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
    .call(xAxis)
    .attr("stroke", "gray") // Set axis stroke color to gray
    .attr("color", "gray"); // Set tick text color to gray

  svg.append("g")
    .call(yAxis)
    .attr("stroke", "gray") // Set axis stroke color to gray
    .attr("color", "gray"); // Set tick text color to gray

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
    .attr("stroke", "cyan") // Use cyan for better visibility on black background
    .attr("stroke-dasharray", "5,5");

  svg.append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", yScale(100))
    .attr("y2", yScale(100))
    .attr("stroke", "cyan") // Use cyan for better visibility on black background
    .attr("stroke-dasharray", "5,5");

  // Add vertical lines at 4000 and 8000 Unix times
  svg.append("line")
    .attr("x1", xScale(4000))
    .attr("x2", xScale(4000))
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "white") // Use white for better visibility on black background
    .attr("stroke-width", 1);

  svg.append("line")
    .attr("x1", xScale(8000))
    .attr("x2", xScale(8000))
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "white") // Use white for better visibility on black background
    .attr("stroke-width", 1);

  // Add heart rate line
  const heartRateLine = d3.line()
    .x(d => xScale(d.unix))
    .y(d => yScale(d.heart_rate_bpm));

  let heartRatePath = svg.append("path")
    .attr("class", "line")
    .attr("d", heartRateLine([])) // Start with an empty path
    .attr("stroke", "lime") // Use lime green for better visibility on black background
    .attr("stroke-width", 1.5)
    .attr("fill", "none");

  // Function to update the chart for the selected student
  function updateChart() {
    const studentData = examData.filter(d => d.student_id === selectedStudent);

    // Update the path with the full data
    heartRatePath
      .datum(studentData)
      .attr("d", heartRateLine);

    // Update real-time information
    const currentData = studentData[studentData.length - 1];
    if (currentData) {
      d3.select("#unix-time").text(currentData.unix);
      d3.select("#heart-rate").text(`${currentData.heart_rate_bpm} BPM`);
    }

    // Display average differences
    displayAverageDifference(studentData, 0, 4000, "beginning");
    displayAverageDifference(studentData, 4000, 8000, "middle");
    displayAverageDifference(studentData, 8000, d3.max(studentData, d => d.unix), "end");
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

    // Remove existing label if it exists
    svg.select(`.average-difference-${section}`).remove();

    // Display the average difference
    const xPos = (xScale(startTime) + xScale(endTime)) / 2; // Center between start and end times
    svg.append("text")
      .attr("class", `average-difference-label average-difference-${section}`)
      .attr("x", xPos)
      .attr("y", margin.top - 10)
      .text(`Avg Diff: ${avgDifference} BPM`)
      .attr("fill", "white"); // Set text color to white
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
  function animateBlackBox() {
    const boxWidth = 50; // Width of the black box
    const boxHeight = height - margin.top - margin.bottom; // Height of the black box

    // Create the black box
    const blackBox = svg.append("rect")
      .attr("class", "black-box")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", boxWidth)
      .attr("height", boxHeight)
      .attr("fill", "black");

    // Function to start the black box animation
    function startBlackBoxAnimation() {
      blackBox
        .attr("x", margin.left)
        .transition()
        .duration(d3.max(examData, d => d.unix) * 0.25) // Match duration with graph animation
        .ease(d3.easeLinear)
        .attr("x", width - margin.right - boxWidth)
        .on("end", startBlackBoxAnimation); // Repeat the animation
    }

    startBlackBoxAnimation(); // Start the animation
  }

  // Initialize the chart for the first student
  animateBlackBox();
  updateChart();
  updateGradeBox();
});