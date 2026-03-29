// public/js/astronaut-repair-game.js
class AstronautRepairGame {
    constructor(containerId) {
        this.containerId = containerId;
        this.currentRepairStage = 1; // 1-based, aligns with missions
        this.totalStages = 5;
        this.isInitialized = false;
        
        // Exact labels from user screenshot
        this.levelConfigs = {
            1: { x: '50%', y: '45%', title: 'Fix System: LEVEL 1', sub: '(practice python basics to complete level 1)' },
            2: { x: '55%', y: '65%', title: 'Engine system: Level 2', sub: 'Variables' },
            3: { x: '35%', y: '50%', title: 'Cadet Alert ! Fuel Leakage!', sub: 'level 3: work on loops' },
            4: { x: '50%', y: '80%', title: 'Looose wires oops!', sub: 'level 4: solve this question' },
            5: { x: '75%', y: '85%', title: 'Launch Sequence: Level 5', sub: 'Systems Go' }
        };
        this.tooltips = [];
    }

    init() {
        if (this.isInitialized) return;
        
        const container = document.getElementById(this.containerId);
        container.innerHTML = ''; // Clear previous contents
        
        // Setup wrapper
        container.style.position = 'relative';
        container.style.height = '100%';
        container.style.overflow = 'hidden';
        container.style.backgroundColor = '#050510';
        
        // Sub-container to center the image
        this.imgWrapper = document.createElement('div');
        this.imgWrapper.style.position = 'absolute';
        this.imgWrapper.style.top = '50%';
        this.imgWrapper.style.left = '50%';
        this.imgWrapper.style.width = '100vw'; 
        this.imgWrapper.style.height = '100vh';
        this.imgWrapper.style.transform = 'translate(-50%, -50%)';
        container.appendChild(this.imgWrapper);

        // Isometric Background Image
        this.img = document.createElement('img');
        this.img.src = '/images/brokenspaceship.png';
        this.img.style.width = '100%';
        this.img.style.height = '100%';
        this.img.style.objectFit = 'contain';
        this.img.style.transition = 'filter 1.5s ease-in-out';
        this.imgWrapper.appendChild(this.img);

        // Setup 5 tooltips mapped to coordinates
        for (let i = 1; i <= 5; i++) {
            let conf = this.levelConfigs[i];
            
            let box = document.createElement('div');
            box.className = 'ship-tooltip';
            box.style.left = `calc(${conf.x} + 25px)`;
            box.style.top = `calc(${conf.y} - 80px)`;
            box.style.cursor = 'pointer';
            
            let title = document.createElement('div');
            title.className = 'ship-tooltip-title';
            title.textContent = conf.title;
            
            let sub = document.createElement('div');
            sub.className = 'ship-tooltip-sub';
            sub.textContent = conf.sub;
            
            box.appendChild(title);
            box.appendChild(sub);
            
            // Interaction: Open level if unlocked
            box.onclick = () => {
                if (i <= this.currentRepairStage) {
                    if (window.openLevel) window.openLevel(i);
                } else {
                    alert("Complete previous levels to unlock this area!");
                }
            };
            
            // Hover effect for unlocked ones
            box.onmouseenter = () => {
                if (i <= this.currentRepairStage) {
                    box.style.transform = 'scale(1.05) translateY(-5px)';
                }
            };
            box.onmouseleave = () => {
                box.style.transform = 'scale(1) translateY(0)';
            };

            let dot = document.createElement('div');
            dot.className = 'ship-target-dot';
            dot.style.left = conf.x;
            dot.style.top = conf.y;
            
            this.imgWrapper.appendChild(box);
            this.imgWrapper.appendChild(dot);
            
            this.tooltips.push({box, dot, stage: i});
        }

        this.isInitialized = true;
        
        // If loaded from existing progress
        if (typeof window.initialRepairStage !== 'undefined') {
            this.currentRepairStage = Math.max(1, window.initialRepairStage + 1);
        }
        
        setTimeout(() => this.updateVisuals(this.currentRepairStage), 100);
    }

    updateVisuals(stage) {
        if (!this.isInitialized) return;
        
        // Image is fully clear now based on user feedback
        this.img.style.filter = 'none';

        // Update appearances of tooltips
        for (let t of this.tooltips) {
            if (t.stage < stage) {
                // Completed
                t.dot.style.backgroundColor = '#00cc66';
                t.dot.style.boxShadow = '0 0 10px #00cc66';
                t.box.style.opacity = '0.9';
                t.box.style.border = '1px solid #00cc66';
                t.box.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
            } else if (t.stage === stage) {
                // Active
                t.dot.style.backgroundColor = '#3a86ff';
                t.dot.style.boxShadow = '0 0 15px #3a86ff';
                t.box.style.opacity = '1';
                t.box.style.border = '2px solid #3a86ff';
                t.box.style.boxShadow = '0 0 20px rgba(58, 134, 255, 0.6)';
            } else {
                // Locked
                t.dot.style.backgroundColor = '#555';
                t.dot.style.boxShadow = 'none';
                t.box.style.opacity = '0.4';
                t.box.style.border = '1px solid #555';
                t.box.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
            }
        }
    }

    repairNextPart() {
        if (this.currentRepairStage > this.totalStages) {
            return true;
        }
        
        this.currentRepairStage++;
        this.updateVisuals(this.currentRepairStage);
        
        return true;
    }

    reset() {
        this.currentRepairStage = 1;
        this.updateVisuals(1);
    }

    getProgress() {
        const fixed = Math.max(0, this.currentRepairStage - 1);
        return {
            currentStage: fixed, 
            totalStages: this.totalStages,
            percentage: Math.floor((fixed / this.totalStages) * 100)
        };
    }

    isReady() {
        return this.isInitialized;
    }
}

window.AstronautRepairGame = AstronautRepairGame;