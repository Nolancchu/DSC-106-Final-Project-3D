document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container');
    const screens = document.querySelectorAll('.screen');
    
    let currentScreen = 0;
    const totalScreens = screens.length;
    
    // Initialize D3 visualizations
    initializeVisualizations();
    
    // Handle keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
            navigateNext();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
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
    
    // Add touch support for mobile
    let touchStartY = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const threshold = 50;
        if (touchStartY - touchEndY > threshold) {
            navigateNext();
        } else if (touchEndY - touchStartY > threshold) {
            navigatePrev();
        }
    }
    
    function navigateNext() {
        if (currentScreen < totalScreens - 1) {
            screens[currentScreen].classList.add('hidden');
            currentScreen++;
            updateScreenPositions();
        }
    }
    
    function navigatePrev() {
        if (currentScreen > 0) {
            screens[currentScreen].classList.add('hidden');
            currentScreen--;
            updateScreenPositions();
        }
    }
    
    function updateScreenPositions() {
        // Add transition class to animate the stick figure
        screens[currentScreen].classList.add('transition');
        setTimeout(() => {
            screens[currentScreen].classList.remove('transition');
        }, 500);
        
        // Update positions of all screens
        screens.forEach((screen, index) => {
            screen.style.transform = `translateY(${(index - currentScreen) * 100}%)`;
            
            // Remove hidden class from current screen
            if (index === currentScreen) {
                setTimeout(() => {
                    screen.classList.remove('hidden');
                }, 300);
            }
        });
    }
    
    function initializeVisualizations() {
        // Sample D3 visualizations - you can replace these with your actual visualizations
        
  
        // Visualization 3: Line chart
        const viz3 = d3.select("#viz3")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%");
            
        const viz3Width = document.getElementById('viz3').clientWidth;
        const viz3Height = document.getElementById('viz3').clientHeight;
            
        const data3 = [
            {x: 0, y: 0.5},
            {x: 0.1, y: 0.4},
            {x: 0.3, y: 0.6},
            {x: 0.5, y: 0.3},
            {x: 0.7, y: 0.7},
            {x: 0.9, y: 0.5},
            {x: 1.0, y: 0.4}
        ];
        
        const line = d3.line()
            .x(d => d.x * viz3Width)
            .y(d => d.y * viz3Height)
            .curve(d3.curveMonotoneX);
            
        viz3.append("path")
            .datum(data3)
            .attr("fill", "none")
            .attr("stroke", "#2ecc71")
            .attr("stroke-width", 3)
            .attr("d", line);
            
        viz3.selectAll("circle")
            .data(data3)
            .enter()
            .append("circle")
            .attr("cx", d => d.x * viz3Width)
            .attr("cy", d => d.y * viz3Height)
            .attr("r", 5)
            .attr("fill", "#27ae60");
            
        // Visualization 4: Pie chart
        const viz4 = d3.select("#viz4")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%");
            
        const viz4Width = document.getElementById('viz4').clientWidth;
        const viz4Height = document.getElementById('viz4').clientHeight;
        const radius = Math.min(viz4Width, viz4Height) / 3;
            
        const data4 = [30, 40, 20, 10];
        const colors = ["#f1c40f", "#e67e22", "#3498db", "#9b59b6"];
        
        const pie = d3.pie()(data4);
        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);
            
        const arcs = viz4.selectAll("arc")
            .data(pie)
            .enter()
            .append("g")
            .attr("transform", `translate(${viz4Width/2}, ${viz4Height/2})`);
            
        arcs.append("path")
            .attr("fill", (d, i) => colors[i])
            .attr("d", arc);
            
        // Visualization 5: Grouped bar chart
        const viz5 = d3.select("#viz5")

            
        const viz5Width = document.getElementById('viz5').clientWidth;
        const viz5Height = document.getElementById('viz5').clientHeight;
            
        const data5 = [
            {values: [20, 30]},
            {values: [35, 25]},
            {values: [15, 40]},
            {values: [25, 35]}
        ];
        
        const barWidth = viz5Width / (data5.length * 3);
        const barSpacing = barWidth / 2;

        data5.forEach((d, i) => {
            
        });
    }

    // Resize the visualizations when window is resized
    window.addEventListener('resize', function() {
        // Clear visualizations
        document.querySelectorAll('.visualization svg').forEach(svg => {
            svg.remove();
        });
        // Reinitialize with new dimensions
        initializeVisualizations();
    });
});
