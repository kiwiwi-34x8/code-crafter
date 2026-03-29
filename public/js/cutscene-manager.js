// public/js/cutscene-manager.js
class CutsceneManager {
    constructor() {
        this.isPlaying = false;
        this.currentScene = null;
        this.stars = [];
    }

    async playIntroCutscene() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        const wrapper = "#cutscene-wrapper";
        const introText = "#cs-intro-text";
        const ship = "#cs-ship-healthy";
        const planet = "#cs-planet";
        const alarm = "#cs-alarm-flash";
        const flash = "#cs-screen-flash";
        const shipCrashed = "#cs-ship-crashed";
        const robot = "#cs-robot";
        const astroDialogue = "#cs-dialogue-astro";
        const aiDialogue = "#cs-dialogue-ai";
        const robotDialogue = "#cs-dialogue-robot";
        const finalPrompt = "#cs-final-prompt";
        const playBtn = "#cs-play-button";

        // Create stars background first
        this.createStarsBackground();

        gsap.registerPlugin(MotionPathPlugin); 
        const tl = gsap.timeline();

        // Start the ambient sounds
        await Tone.start();
        this.sceneHum = new Tone.NoiseSynth("brown").toDestination();
        this.sceneHum.volume.value = -30;
        this.sceneHum.triggerAttack();

        // Space music
        this.spaceMusic = new Tone.AMSynth({
            harmonicity: 1.5,
            oscillator: { type: "sine" },
            envelope: { attack: 4, decay: 0.1, sustain: 1 },
            modulation: { type: "triangle" },
            modulationEnvelope: { attack: 4, decay: 0.1, sustain: 1 }
        }).toDestination();
        this.spaceMusic.volume.value = -15;

        // Sound effects
        this.alarmSound = new Tone.Synth().toDestination();
        this.alarmLoop = new Tone.Loop(time => { 
            this.alarmSound.triggerAttackRelease("C5", "8n", time); 
        }, "4n").start(0);
        
        this.explosionSound = new Tone.NoiseSynth({ 
            noise: { type: 'pink' }, 
            envelope: { attack: 0.01, decay: 0.5, sustain: 0 } 
        }).toDestination();
        
        this.staticSound = new Tone.NoiseSynth({ 
            noise: { type: 'white' }, 
            envelope: { attack: 0.01, decay: 0.1, sustain: 0 } 
        }).toDestination();
        this.staticSound.volume.value = -20;

        tl
            // 1. Fade In with stars
            .call(() => {
                this.spaceMusic.triggerAttack("C2");
                this.animateStars();
            })
            .to(introText, { opacity: 1, duration: 3 }, "<")
            .to(introText, { opacity: 0, duration: 1 }, "+=1")

            // 2. Spaceship Appears
            .to(ship, { left: "10%", opacity: 1, duration: 5, ease: "power1.out" })
            .call(() => this.typeCutsceneDialogue("dialogue-astro-text", "All systems stable. Course set for the Kepler-9 orbit. Time to run the final diagnostics..."))
            .to(astroDialogue, { scale: 1, opacity: 1, duration: 0.5 }, "-=0.5")
            
            // 3. Malfunction with proper alarm effects
            .to(astroDialogue, { opacity: 0, duration: 0.5 }, "+=3")
            .call(() => this.playAlarmSound(true))
            .call(() => this.startAlarmVisuals()) // Start red flashing
            .to(ship, { x: "+=7", y: "+=3", duration: 0.1, repeat: 15, yoyo: true }, "<")
            .call(() => this.staticSound.triggerAttackRelease("0.2"))
            .call(() => this.typeCutsceneDialogue("dialogue-ai-text", "ALERT! ENGINE FAILURE DETECTED!"))
            .to(aiDialogue, { scale: 1, opacity: 1, duration: 0.5 }, "-=1")

            // 4. Astronaut Reacts
            .to(aiDialogue, { opacity: 0, duration: 0.5 }, "+=2")
            .call(() => this.typeCutsceneDialogue("dialogue-astro-text", "What—? The thrusters just went offline! Mainframe's not responding!"))
            .to(astroDialogue, { opacity: 1, scale: 1, duration: 0.5 }, "-=0.5")

            // 5. Descent with countdown
            .to(astroDialogue, { opacity: 0, duration: 0.5 }, "+=3")
            .call(() => this.typeCutsceneDialogue("dialogue-ai-text", "Warning! Altitude decreasing! Impact in 5…"))
            .to(aiDialogue, { opacity: 1, scale: 1, duration: 0.5 }, "-=0.5")
            .call(() => this.typeCutsceneDialogue("dialogue-ai-text", "Warning! Altitude decreasing! Impact in 4…"), "+=1")
            .call(() => this.typeCutsceneDialogue("dialogue-ai-text", "Warning! Altitude decreasing! Impact in 3…"), "+=1")
            .call(() => this.typeCutsceneDialogue("dialogue-ai-text", "Warning! Altitude decreasing! Impact in 2…"), "+=1")
            .call(() => this.typeCutsceneDialogue("dialogue-ai-text", "Warning! Altitude decreasing! Impact in 1…"), "+=1")
            .to(ship, { 
                duration: 3, 
                ease: "power1.in",
                motionPath: {
                    path: [{left: "40%", top: "30%"}, {left: "65%", top: "35%"}],
                    curviness: 1.25
                }
            }, "<")

            // 6. Crash with explosion
            .to(aiDialogue, { opacity: 0, duration: 0.5 }, "+=2")
            .call(() => this.typeCutsceneDialogue("dialogue-astro-text", "Brace for impact! I'm going down!!"))
            .to(astroDialogue, { opacity: 1, scale: 1, duration: 0.5 }, "-=0.5")
            .call(() => this.playAlarmSound(false))
            .call(() => this.stopAlarmVisuals()) // Stop red flashing
            .to(ship, { opacity: 0, duration: 0.1 }, "+=1.5")
            .call(() => this.explosionSound.triggerAttackRelease("0.5"))
            .to(flash, { opacity: 1, duration: 0.1, yoyo: true, repeat: 1 })
            .to(wrapper, { x: "+=20", duration: 0.1, yoyo: true, repeat: 3 }, "<")
            .to(astroDialogue, { opacity: 0, duration: 0.5 }, "<")

            // 7. Aftermath
            .to(planet, { opacity: 0.3, duration: 2 }, "+=1")
            .to(shipCrashed, { y: 0, opacity: 1, duration: 2 })
            .to(robot, { y: 0, opacity: 1, duration: 1 }, "-=1")
            .call(() => this.typeCutsceneDialogue("dialogue-robot-text", "System check... catastrophic damage detected."))
            .to(robotDialogue, { scale: 1, opacity: 1, duration: 0.5 }, "-=0.5")

            // 8. Mission Setup
            .to(robotDialogue, { opacity: 0, duration: 0.5 }, "+=3")
            .call(() => this.typeCutsceneDialogue("dialogue-astro-text", "The main systems are fried. No contact with the base. The only way to fix this ship... is to reprogram it — line by line."))
            .to(astroDialogue, { opacity: 1, scale: 1, duration: 0.5 }, "-=0.5")

            // 9. Game Start
            .to(astroDialogue, { opacity: 0, duration: 0.5 }, "+=4")
            .to(finalPrompt, { opacity: 1, duration: 1 })
            .to(playBtn, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out" })
            .call(() => {
                this.sceneHum.triggerRelease();
                this.isPlaying = false;
            });
    }

    createStarsBackground() {
        const cutsceneWrapper = document.getElementById('cutscene-wrapper');
        
        // Create stars container
        const starsContainer = document.createElement('div');
        starsContainer.id = 'stars-background';
        starsContainer.style.position = 'absolute';
        starsContainer.style.top = '0';
        starsContainer.style.left = '0';
        starsContainer.style.width = '100%';
        starsContainer.style.height = '100%';
        starsContainer.style.zIndex = '-1';
        starsContainer.style.overflow = 'hidden';
        
        cutsceneWrapper.appendChild(starsContainer);

        // Create stars
        for (let i = 0; i < 150; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.position = 'absolute';
            star.style.width = Math.random() * 3 + 'px';
            star.style.height = star.style.width;
            star.style.backgroundColor = 'white';
            star.style.borderRadius = '50%';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.opacity = Math.random() * 0.8 + 0.2;
            
            starsContainer.appendChild(star);
            this.stars.push(star);
        }
    }

    animateStars() {
        // Animate stars with twinkling effect
        this.stars.forEach((star, index) => {
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 2;
            
            gsap.to(star, {
                opacity: Math.random() * 0.5 + 0.2,
                duration: duration,
                repeat: -1,
                yoyo: true,
                delay: delay,
                ease: "sine.inOut"
            });
        });

        // Add some shooting stars occasionally
        this.createShootingStars();
    }

    createShootingStars() {
        const createShootingStar = () => {
            const shootingStar = document.createElement('div');
            shootingStar.style.position = 'absolute';
            shootingStar.style.width = '2px';
            shootingStar.style.height = '2px';
            shootingStar.style.backgroundColor = 'white';
            shootingStar.style.borderRadius = '50%';
            shootingStar.style.left = Math.random() * 20 + '%';
            shootingStar.style.top = Math.random() * 20 + '%';
            shootingStar.style.opacity = '0';
            
            document.getElementById('stars-background').appendChild(shootingStar);

            gsap.to(shootingStar, {
                x: '100vw',
                y: '100vh',
                opacity: 1,
                duration: 1,
                ease: "power2.out",
                onComplete: () => {
                    shootingStar.remove();
                }
            });

            // Schedule next shooting star
            setTimeout(createShootingStar, Math.random() * 8000 + 2000);
        };

        // Start the first shooting star
        setTimeout(createShootingStar, 2000);
    }

    startAlarmVisuals() {
        const alarmFlash = document.getElementById('cs-alarm-flash');
        if (!alarmFlash) return;

        // Red alarm flash effect
        gsap.to(alarmFlash, {
            backgroundColor: 'rgba(255, 0, 0, 0.3)',
            duration: 0.1,
            repeat: 15,
            yoyo: true,
            ease: "power1.inOut"
        });

        // Also flash the AI dialogue in red
        const aiDialogue = document.getElementById('cs-dialogue-ai');
        if (aiDialogue) {
            gsap.to(aiDialogue, {
                backgroundColor: 'rgba(255, 0, 0, 0.8)',
                duration: 0.1,
                repeat: 15,
                yoyo: true,
                ease: "power1.inOut"
            });
        }
    }

    stopAlarmVisuals() {
        const alarmFlash = document.getElementById('cs-alarm-flash');
        if (alarmFlash) {
            gsap.killTweensOf(alarmFlash);
            alarmFlash.style.backgroundColor = 'transparent';
        }

        const aiDialogue = document.getElementById('cs-dialogue-ai');
        if (aiDialogue) {
            gsap.killTweensOf(aiDialogue);
            aiDialogue.style.backgroundColor = '#1e2358';
        }
    }

    typeCutsceneDialogue(elementId, text) {
        let i = 0;
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.textContent = "";
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i); 
                i++; 
                setTimeout(type, 50);
            }
        }
        type();
    }

    playAlarmSound(play) {
        Tone.start();
        if (play) {
            Tone.Transport.start();
        } else {
            Tone.Transport.stop();
        }
    }

    fadeOutMusic() {
        if (this.spaceMusic) {
            this.spaceMusic.volume.rampTo(-Infinity, 2.0);
        }
    }

    skipCutscene() {
        if (this.isPlaying) {
            gsap.getTweensOf("#cutscene-wrapper *").forEach(tween => tween.kill());
            
            // Stop all sounds
            this.playAlarmSound(false);
            this.fadeOutMusic();
            if (this.sceneHum) {
                this.sceneHum.triggerRelease();
            }
            
            document.getElementById('cutscene-wrapper').style.display = 'none';
            this.isPlaying = false;
        }
    }

    // Clean up method
    destroy() {
        this.stars.forEach(star => {
            if (star.parentNode) {
                star.parentNode.removeChild(star);
            }
        });
        this.stars = [];
        
        const starsBackground = document.getElementById('stars-background');
        if (starsBackground) {
            starsBackground.remove();
        }
    }
}