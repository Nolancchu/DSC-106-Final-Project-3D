let examData = [];
let selectedStudent = "S1"; // Default selected student

const margin = { top: 40, right: 30, bottom: 50, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

d3.csv("final_data.csv").then(data => {
  examData = data.filter(d => d.exam_name === "Midterm 1");

  examData.forEach(d => {
    d.unix = +d.unix;
    d.heart_rate_bpm = +d.heart_rate_bpm;
    d.grade = +d.grade;
  });

  const studentIds = [...new Set(examData.map(d => d.student_id))];

  const buttonContainer = d3.select("#button-container");
  const buttons = buttonContainer.selectAll("button")
    .data(studentIds)
    .enter()
    .append("button")
    .text(d => d)
    .attr("class", "student-button")
    .style("background-color", "gray")
    .classed("active", d => d === selectedStudent)
    .on("click", function (event, d) {
      buttons.classed("active", false).style("background-color", "gray");
      const studentData = examData.find(data => data.student_id === d);
      let color = "gray";
      if (studentData.grade >= 85) color = "lightgreen";
      else if (studentData.grade >= 75) color = "orange";
      else color = "lightcoral";
      d3.select(this).classed("active", true).style("background-color", color);
      selectedStudent = d;

      // Update the student ID in the real-time box
      d3.select("#student-id").text(d);

      // Update the chart and grade box
      updateChart();
      updateGradeBox();
    });

  const defaultStudentData = examData.find(data => data.student_id === selectedStudent);
  let defaultColor = "gray";
  if (defaultStudentData.grade >= 85) defaultColor = "lightgreen";
  else if (defaultStudentData.grade >= 75) defaultColor = "orange";
  else defaultColor = "lightcoral";
  d3.select(".student-button.active").style("background-color", defaultColor);

  const maxUnixTime = d3.max(examData, d => d.unix);
  const maxMinutes = maxUnixTime / 60; // Convert max Unix time to minutes

  // Update xScale to use minutes
  const xScale = d3.scaleLinear()
    .domain([0, maxMinutes]) // Domain is now in minutes
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([0, 220])
    .range([height - margin.bottom, margin.top]);

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Update xAxis to format ticks in minutes
  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d => `${d}`); // Format ticks as "X min"

  const yAxis = d3.axisLeft(yScale);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .attr("stroke", "gray")
    .attr("color", "gray");

  svg.append("g")
    .call(yAxis)
    .attr("stroke", "gray")
    .attr("color", "gray");

  // Update the x-axis label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - margin.bottom + 40)
    .attr("text-anchor", "middle")
    .attr("fill", "gray")
    .attr("font-size", "12px")
    .text("Time (Minutes)"); // Updated label

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", margin.left - 100)
    .attr("text-anchor", "middle")
    .attr("fill", "gray")
    .attr("font-size", "12px")
    .text("Heart Rate (BPM)");

  svg.append("rect")
    .attr("x", margin.left)
    .attr("y", yScale(100))
    .attr("width", width - margin.left - margin.right)
    .attr("height", yScale(60) - yScale(100))
    .attr("fill", "lightblue")
    .attr("opacity", 0.3);

  svg.append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", yScale(60))
    .attr("y2", yScale(60))
    .attr("stroke", "cyan")
    .attr("stroke-dasharray", "5,5");

  svg.append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", yScale(100))
    .attr("y2", yScale(100))
    .attr("stroke", "cyan")
    .attr("stroke-dasharray", "5,5");

  // Update vertical lines to use minutes
  svg.append("line")
    .attr("x1", xScale(4000 / 60)) // Convert to minutes
    .attr("x2", xScale(4000 / 60))
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "white")
    .attr("stroke-width", 1);

  svg.append("line")
    .attr("x1", xScale(8000 / 60)) // Convert to minutes
    .attr("x2", xScale(8000 / 60))
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "white")
    .attr("stroke-width", 1);

  // Update text labels for exam sections
  svg.append("text")
    .attr("x", (xScale(0) + xScale(4000 / 60)) / 2)
    .attr("y", height - margin.bottom + 70)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .text("Beginning of Exam");

  svg.append("text")
    .attr("x", (xScale(4000 / 60) + xScale(8000 / 60)) / 2)
    .attr("y", height - margin.bottom + 70)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .text("Middle of Exam");

  svg.append("text")
    .attr("x", (xScale(8000 / 60) + xScale(maxMinutes)) / 2)
    .attr("y", height - margin.bottom + 70)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .text("End of Exam");

  // Update heartRateLine to use minutes
  const heartRateLine = d3.line()
    .x(d => xScale(d.unix / 60)) // Convert Unix time to minutes
    .y(d => yScale(d.heart_rate_bpm));

  let heartRatePath = svg.append("path")
    .attr("class", "line")
    .attr("d", heartRateLine([]))
    .attr("stroke", "red")
    .attr("stroke-width", 1.5)
    .attr("fill", "none");

  function updateChart() {
    const studentData = examData.filter(d => d.student_id === selectedStudent);
    heartRatePath.datum(studentData).attr("d", heartRateLine);

    const currentData = studentData[studentData.length - 1];
    if (currentData) {
      d3.select("#unix-time").text((currentData.unix / 60).toFixed(2)); // Convert to minutes
      d3.select("#heart-rate").text(`${currentData.heart_rate_bpm} BPM`);
    }

    displayAverageDifference(studentData, 0, 1900, "beginning");
    displayAverageDifference(studentData, 4000, 6300, "middle");
    displayAverageDifference(studentData, 8000, d3.max(studentData, d => d.unix - 1200), "end");
  }

  function displayAverageDifference(data, startTime, endTime, section) {
    const sectionData = data.filter(d => d.unix >= startTime && d.unix <= endTime);
    if (sectionData.length === 0) return;

    const avgHeartRate = d3.mean(sectionData, d => d.heart_rate_bpm);
    if (isNaN(avgHeartRate)) return;

    const restingHeartRate = 80;
    const avgDifference = (avgHeartRate - restingHeartRate).toFixed(2);

    svg.select(`.average-difference-${section}`).remove();
    const xPos = (xScale(startTime / 60) + xScale(endTime / 60)) / 2; // Convert to minutes
    svg.append("text")
      .attr("class", `average-difference-label average-difference-${section}`)
      .attr("x", xPos)
      .attr("y", margin.top - 10)
      .text(`+${avgDifference} BPM`)
      .attr("fill", "red")
      .attr("font-weight", "600");
  }

  function updateGradeBox() {
    const studentData = examData.filter(d => d.student_id === selectedStudent);
    const grade = studentData[0].grade;
    const gradeBox = d3.select("#grade-box");
    gradeBox.text(`Grade: ${grade}`);

    if (grade >= 85) {
      gradeBox.style("background-color", "lightgreen");
    } else if (grade >= 75) {
      gradeBox.style("background-color", "orange");
    } else {
      gradeBox.style("background-color", "lightcoral");
    }
  }

  function animateBlackBox() {
    const boxWidth = 25;
    const boxHeight = height - margin.top - margin.bottom;
  
    const blackBox = svg.append("rect")
      .attr("class", "black-box")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", boxWidth)
      .attr("height", boxHeight)
      .attr("fill", "black")
      .attr("opacity", 0.9);
  
    function startBlackBoxAnimation() {
      blackBox
        .attr("x", margin.left)
        .transition()
        .duration(20000) // Adjust duration if needed
        .ease(d3.easeLinear)
        .attr("x", width - margin.right - boxWidth)
        .on("end", startBlackBoxAnimation)
        .on("interrupt", () => console.log("Animation interrupted"))
        .tween("move", function() {
          const studentData = examData.filter(d => d.student_id === selectedStudent);
          const maxTimeInMinutes = d3.max(studentData, d => d.unix / 60); // Convert max Unix time to minutes
  
          return function(t) {
            const currentX = margin.left + (width - margin.right - boxWidth - margin.left) * t;
            const currentTimeInMinutes = maxTimeInMinutes * t; // Current time in minutes
  
            // Find the closest data point to the current time
            const closestDataPoint = studentData.reduce((prev, curr) => {
              const currTimeInMinutes = curr.unix / 60; // Convert Unix time to minutes
              const prevTimeInMinutes = prev.unix / 60; // Convert Unix time to minutes
              return (Math.abs(currTimeInMinutes - currentTimeInMinutes) < Math.abs(prevTimeInMinutes - currentTimeInMinutes) ? curr : prev);
            });
  
            // Update the real-time data box
            d3.select("#unix-time").text(currentTimeInMinutes.toFixed(2)); // Display time in minutes
            d3.select("#heart-rate").text(`${closestDataPoint.heart_rate_bpm} BPM`);
          };
        });
    }
  
    startBlackBoxAnimation();
  }

  function calculateStressScore(performanceGroup, testSection) {
    const groupData = examData.filter(d => {
      if (performanceGroup === "good") return d.grade >= 85;
      else if (performanceGroup === "average") return d.grade >= 75 && d.grade < 85;
      else return d.grade < 75;
    });

    let startTime, endTime;
    if (testSection === "beginning") {
      startTime = 0;
      endTime = 1300;
    } else if (testSection === "middle") {
      startTime = 4000;
      endTime = 5500;
    } else {
      startTime = 8000;
      endTime = d3.max(groupData, d => d.unix - 1400);
    }

    const sectionData = groupData.filter(d => d.unix >= startTime && d.unix <= endTime);
    const avgHeartRate = d3.mean(sectionData, d => d.heart_rate_bpm);
    const restingHeartRate = 80;
    const avgDifference = (avgHeartRate - restingHeartRate).toFixed(2);

    d3.select("#stress-score-value").text(`+${avgDifference} BPM`);
  }

  d3.select("#performance-group").on("change", function() {
    const performanceGroup = this.value;
    const testSection = d3.select("#test-section").node().value;
    calculateStressScore(performanceGroup, testSection);
  });

  d3.select("#test-section").on("change", function() {
    const testSection = this.value;
    const performanceGroup = d3.select("#performance-group").node().value;
    calculateStressScore(performanceGroup, testSection);
  });

  calculateStressScore("good", "beginning");

  animateBlackBox();
  updateChart();
  updateGradeBox();
});