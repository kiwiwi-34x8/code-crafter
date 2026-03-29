// public/js/mission-handler.js
class MissionHandler {
    constructor() {
        this.currentMission = 1;
        this.totalMissions = 5;
        this.missions = {
            1: {
                title: "Fix System: LEVEL 1",
                description: "The main screen is fractured. Practice Python basics to complete level 1. Print 'Hello Voyager!' to the terminal to begin.",
                correctCode: "print('Hello Voyager!')",
                hint: "Use the print() function with the exact text inside quotes.",
                repairPart: "cockpit",
                successMessage: "✅ Main Computer Rebooted! Diagnostics online!"
            },
            2: {
                title: "Engine system: Level 2", 
                description: "The engine is starved of fuel. Practice with Variables to start the combustion! Create a variable named 'engine_fuel' and set it to 100.",
                correctCode: "engine_fuel = 100",
                hint: "Use the format: variable_name = value",
                repairPart: "engine",
                successMessage: "✅ Fuel levels normalized! Engine roaring!"
            },
            3: {
                title: "Cadet Alert ! Fuel Leakage! Level 3",
                description: "Work on Loops. We have multiple leaks! Write a 'for' loop using 'range(5)' and print 'Patching leak' inside it.",
                correctCode: "for i in range(5):\n    print('Patching leak')",
                hint: "Use 'for i in range(5):' and don't forget the indentation for the print statement!",
                repairPart: "pipes", 
                successMessage: "✅ All 5 leaks patched! Coolant pressure stable!"
            },
            4: {
                title: "Loose wires oops! Level 4",
                description: "Solve this question with Functions. The control panel is disconnected. Define a function 'connect()' that returns 'Online'. Call the function and print the result.",
                correctCode: "def connect():\n    return 'Online'\nprint(connect())",
                hint: "Use 'def connect():' then 'return' the string 'Online'. Then print the call to connect().",
                repairPart: "shields",
                successMessage: "✅ Wires reconnected! Subsystem online!"
            },
            5: {
                title: "Launch Sequence: Level 5", 
                description: "Time to go! Learn Conditionals. Create a variable 'systems_go = True', then write an 'if' block checking 'systems_go' that prints 'Initiate Launch!'",
                correctCode: "systems_go = True\nif systems_go:\n    print('Initiate Launch!')",
                hint: "Assign True to systems_go, then use 'if systems_go:' and print 'Initiate Launch!'",
                repairPart: "launch",
                successMessage: "✅ Sequence approved! LAUNCHING INTO ORBIT!"
            }
        };
    }

    checkMissionAnswer(missionNumber, userCode, output) {
        const mission = this.missions[missionNumber];
        
        if (!mission) {
            return { success: false, message: "Mission not found" };
        }

        switch(missionNumber) {
            case 1:
                if (output.includes("Hello Voyager!")) {
                    return { success: true, message: mission.successMessage };
                }
                break;
                
            case 2:
                if (userCode.includes("engine_fuel = 100") || userCode.includes("engine_fuel=100")) {
                    return { success: true, message: mission.successMessage };
                }
                break;
                
            case 3:
                const patches = (output.match(/Patching leak/g) || []).length;
                if (userCode.includes("for ") && patches >= 5) {
                    return { success: true, message: mission.successMessage };
                }
                break;
                
            case 4:
                if (userCode.includes("def calibrate") && output.includes("Shields Up")) {
                    return { success: true, message: mission.successMessage };
                }
                break;
                
            case 5:
                if (userCode.includes("if ") && output.includes("Initiate Launch!")) {
                    return { success: true, message: mission.successMessage };
                }
                break;
        }

        return { 
            success: false, 
            message: "❌ That's not quite right. Check your code and try again." 
        };
    }

    getCurrentMission() {
        return this.missions[this.currentMission];
    }

    advanceMission() {
        if (this.currentMission < this.totalMissions) {
            this.currentMission++;
            return true;
        }
        return false;
    }

    resetMissions() {
        this.currentMission = 1;
    }

    getMissionCode(missionNumber) {
        const mission = this.missions[missionNumber];
        return mission ? mission.correctCode : "";
    }
}