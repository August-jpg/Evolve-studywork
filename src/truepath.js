import { global, sizeApproximation } from './vars.js';
import { vBind, clearElement, popover, messageQueue, powerCostMod, spaceCostMultiplier, deepClone } from './functions.js';
import { races, genusVars } from './races.js';
import { payCosts } from './actions.js';
import { fuel_adjust, spaceTech } from './space.js';
import { loc } from './locale.js';

export const outerTruth = {
    spc_titan: {
        info: {
            name(){
                return genusVars[races[global.race.species].type].solar.titan;
            },
            desc(){
                return loc('space_titan_info_desc',[genusVars[races[global.race.species].type].solar.titan, races[global.race.species].home]);
            },
            support: 'titan_spaceport',
            zone: 'outer'
        },
        titan_mission: {
            id: 'space-titan_mission',
            title(){
                return loc('space_mission_title',[genusVars[races[global.race.species].type].solar.titan]);
            },
            desc(){
                return loc('space_mission_desc',[genusVars[races[global.race.species].type].solar.titan]);
            },
            reqs: { outer: 1 },
            grant: ['titan',1],
            path: 'truepath',
            no_queue(){ return global.queue.queue.some(item => item.id === $(this)[0].id) ? true : false; },
            cost: { 
                Helium_3(){ return +fuel_adjust(250000).toFixed(0); },
                Elerium(){ return 100; }
            },
            effect(){
                return loc('space_titan_mission_effect',[genusVars[races[global.race.species].type].solar.titan]);
            },
            action(){
                if (payCosts($(this)[0])){
                    messageQueue(loc('space_titan_mission_action',[genusVars[races[global.race.species].type].solar.titan, races[global.race.species].home]),'info');
                    return true;
                }
                return false;
            }
        },
        titan_spaceport: {
            id: 'space-titan_spaceport',
            title: loc('space_red_spaceport_title'),
            desc: `<div>${loc('space_red_spaceport_desc')}</div><div class="has-text-special">${loc('requires_power')}</div>`,
            reqs: { titan: 1 },
            path: 'truepath',
            cost: {
                Money(offset){ return spaceCostMultiplier('titan_spaceport', offset, 2500000, 1.32); },
                Iridium(offset){ return spaceCostMultiplier('titan_spaceport', offset, 3500, 1.32); },
                Mythril(offset){ return spaceCostMultiplier('titan_spaceport', offset, 50, 1.32); },
                Titanium(offset){ return spaceCostMultiplier('titan_spaceport', offset, 45000, 1.32); }
            },
            effect(){
                let helium = +(fuel_adjust(5,true)).toFixed(2);
                return `<div>${loc('space_red_spaceport_effect1',[races[global.race.species].solar.red,$(this)[0].support()])}</div><div class="has-text-caution">${loc('space_red_spaceport_effect2',[helium,$(this)[0].powered()])}</div><div class="has-text-caution">${loc('spend',[global.race['cataclysm'] ? 2 : 25,global.resource.Food.name])}</div>`;
            },
            support(){
                return 2;
            },
            powered(){ return powerCostMod(8); },
            refresh: true,
            action(){
                if (payCosts($(this)[0])){
                    incrementStruct('titan_spaceport');
                    if (global.city.power >= $(this)[0].powered()){
                        global.space['titan_spaceport'].on++;
                    }
                    if (global.tech['titan'] <= 1){
                        global.tech['titan'] = 2;
                    }
                    return true;
                }
                return false;
            }
        },
    },
    spc_enceladus: {
        info: {
            name(){
                return genusVars[races[global.race.species].type].solar.enceladus;
            },
            desc(){
                return loc('space_enceladus_info_desc',[genusVars[races[global.race.species].type].solar.enceladus, races[global.race.species].home]);
            },
            zone: 'outer'
        },
        enceladus_mission: {
            id: 'space-enceladus_mission',
            title(){
                return loc('space_mission_title',[genusVars[races[global.race.species].type].solar.enceladus]);
            },
            desc(){
                return loc('space_mission_desc',[genusVars[races[global.race.species].type].solar.enceladus]);
            },
            reqs: { outer: 1 },
            grant: ['enceladus',1],
            path: 'truepath',
            no_queue(){ return global.queue.queue.some(item => item.id === $(this)[0].id) ? true : false; },
            cost: { 
                Helium_3(){ return +fuel_adjust(250000).toFixed(0); },
                Elerium(){ return 100; }
            },
            effect(){
                return loc('space_titan_mission_effect',[genusVars[races[global.race.species].type].solar.enceladus]);
            },
            action(){
                if (payCosts($(this)[0])){
                    messageQueue(loc('space_enceladus_mission_action',[genusVars[races[global.race.species].type].solar.enceladus]),'info');
                    return true;
                }
                return false;
            }
        },
    },
};

export function drawShipYard(){
    if (!global.settings.tabLoad && (global.settings.civTabs !== 2 || global.settings.govTabs !== 5)){
        return;
    }
    clearElement($('#dwarfShipYard'));
    if (global.space.hasOwnProperty('shipyard') && global.settings.showShipYard){
        let yard = $(`#dwarfShipYard`);

        if (!global.space.shipyard.hasOwnProperty('blueprint')){
            global.space.shipyard['blueprint'] = {
                class: 'corvette',
                armor: 'steel',
                weapon: 'railgun',
                engine: 'ion',
                power: 'diesel',
                sensor: 'radar',
                name: 'Trident'
            };
        }

        let plans = $(`<div id="shipPlans"></div>`);
        yard.append(plans);

        let shipStats = $(`<div class="stats"></div>`);
        plans.append(shipStats);

        shipStats.append(`<div class="registry"><span class="has-text-caution">${loc(`outer_shipyard_registry`)}</span>: <b-input v-model="b.name" maxlength="25" class="nameplate"></b-input></div>`);
        shipStats.append(`<div><span class="has-text-caution">${loc(`crew`)}</span> <span v-html="crewText()"></span></div>`);
        shipStats.append(`<div><span class="has-text-caution">${loc(`power`)}</span> <span v-html="powerText()"></span></div>`);
        shipStats.append(`<div><span class="has-text-caution">${loc(`firepower`)}</span> <span v-html="fireText()"></span></div>`);
        shipStats.append(`<div><span class="has-text-caution">${loc(`outer_shipyard_sensors`)}</span> <span v-html="sensorText()"></span></div>`);
        shipStats.append(`<div><span class="has-text-caution">${loc(`speed`)}</span> <span v-html="speedText()"></span></div>`);

        plans.append(`<div id="shipYardCosts" class="costList"></div>`);

        let options = $(`<div class="shipBayOptions"></div>`);
        plans.append(options);

        let shipConfig = {
            class: ['corvette','frigate','destroyer','cruiser','battlecruiser','dreadnought'],
            power: ['solar','diesel','fission','fusion','elerium'],
            weapon: ['railgun','laser','p_laser','plasma','phaser','disrupter'],
            armor : ['steel','alloy','neutronium'],
            engine: ['ion','tie','pulse','photon','vacuum'],
            sensor: ['visual','radar','lidar','quantum'],
        };
        
        Object.keys(shipConfig).forEach(function(k){
            let values = ``;
            shipConfig[k].forEach(function(v,idx){
                values += `<b-dropdown-item aria-role="listitem" v-on:click="setVal('${k}','${v}')" class="${k} a${idx}" data-val="${v}" v-show="avail('${k}','${idx}')">${loc(`outer_shipyard_${k}_${v}`)}</b-dropdown-item>`;
            });

            options.append(`<b-dropdown :triggers="['hover']" aria-role="list">
                <button class="button is-info" slot="trigger">
                    <span>${loc(`outer_shipyard_${k}`)}: {{ b.${k} | lbl('${k}') }}</span>
                </button>${values}
            </b-dropdown>`);
        });

        plans.append(`<div class="assemble"><button class="button is-info" slot="trigger" v-on:click="build()"><span>${loc('outer_shipyard_build')}</span></button></div>`);

        updateCosts();

        vBind({
            el: '#shipPlans',
            data: {
                b: global.space.shipyard.blueprint
            },
            methods: {
                setVal(b,v){
                    global.space.shipyard.blueprint[b] = v;
                    updateCosts();
                },
                avail(k,i){
                    return global.tech[`syard_${k}`] > i ? true : false;
                },
                crewText(){
                    return shipCrewSize(global.space.shipyard.blueprint);
                },
                powerText(){
                    let power = shipPower(global.space.shipyard.blueprint);
                    if (power < 0){
                        return `<span class="has-text-danger">${power}kW</span>`;
                    }
                    return `${power}kW`;
                },
                fireText(){
                    return shipAttackPower(global.space.shipyard.blueprint);
                },
                sensorText(){
                    switch (global.space.shipyard.blueprint.sensor){
                        case 'visual':
                            return `1km`;
                        case 'radar':
                            return `10km`;
                        case 'lidar':
                            return `20km`;
                        case 'quantum':
                            return `40km`;
                    }
                },
                speedText(){
                    let speed = shipSpeed(global.space.shipyard.blueprint);
                    return +speed.toFixed(2);
                },
                build(){
                    if (shipPower(global.space.shipyard.blueprint) >= 0){
                        let raw = shipCosts(global.space.shipyard.blueprint);
                        let costs = {};
                        Object.keys(raw).forEach(function(res){
                            costs[res] = function(){ return raw[res]; }
                        });
                        if (payCosts(false, costs)){
                            let ship = deepClone(global.space.shipyard.blueprint);
                            ship['location'] = 'spc_dwarf';
                            ship['transit'] = 0;
                            ship['damage'] = 0;

                            let num = 1;
                            let name = ship.name;
                            while (global.space.shipyard.ships.filter(s => s.name === name).length > 0){
                                num++;
                                name = ship.name + ` ${num}`;
                            }
                            ship.name = name;

                            global.space.shipyard.ships.push(ship);
                            drawShips();
                        }
                    }
                }
            },
            filters: {
                lbl(l,c){
                    return loc(`outer_shipyard_${c}_${l}`);
                }
            }
        });

        Object.keys(shipConfig).forEach(function(type){
            for (let i=0; i<$(`#shipPlans .${type}`).length; i++){
                popover(`shipPlans${type}${i}`, function(obj){
                    let val = $(obj.this).attr(`data-val`);
                    return loc(`outer_shipyard_${type}_${val}_desc`);
                },
                {
                    elm: `#shipPlans .${type}.a${i}`,
                    placement: 'right'
                });
            }
        });

        yard.append($(`<div id="shipList"></div>`));
        drawShips();
    }
}

function updateCosts(){
    let costs = shipCosts(global.space.shipyard.blueprint);
    clearElement($(`#shipYardCosts`));

    Object.keys(costs).forEach(function(k){
        if (k === 'Money'){
            $(`#shipYardCosts`).append(`<span class="res-${k} has-text-success" data-${k}="${costs[k]}" data-ok="has-text-success">${global.resource[k].name}${sizeApproximation(costs[k])}</span>`);
        }
        else {
            $(`#shipYardCosts`).append(`<span> | </span><span class="res-${k} has-text-success" data-${k}="${costs[k]}" data-ok="has-text-success">${global.resource[k].name} ${sizeApproximation(costs[k])}</span>`);
        }
    });
}

function shipCrewSize(ship){
    switch (ship.class){
        case 'corvette':
            return 2;
        case 'frigate':
            return 3;
        case 'destroyer':
            return 5;
        case 'cruiser':
            return 8;
        case 'battlecruiser':
            return 12;
        case 'dreadnought':
            return 20;
    }
}

function shipPower(ship){
    let watts = 0;

    let out_inflate = 1;
    let use_inflate = 1;
    switch (ship.class){
        case 'frigate':
            out_inflate = 1.1;
            use_inflate = 1.2;
            break;
        case 'destroyer':
            out_inflate = 1.5;
            use_inflate = 1.65;
            break;
        case 'cruiser':
            out_inflate = 2;
            use_inflate = 2.5;
            break;
        case 'battlecruiser':
            out_inflate = 2.5;
            use_inflate = 3.5;
            break;
        case 'dreadnought':
            out_inflate = 5;
            use_inflate = 8;
            break;
    }

    switch (ship.power){
        case 'solar':
            watts = Math.round(50 * out_inflate);
            break;
        case 'diesel':
            watts = Math.round(100 * out_inflate);
            break;
        case 'fission':
            watts = Math.round(150 * out_inflate);
            break;
        case 'fusion':
            watts = Math.round(175 * out_inflate);
            break;
        case 'elerium':
            watts = Math.round(200 * out_inflate);
            break;
    }

    switch (ship.weapon){
        case 'railgun':
            watts -= Math.round(10 * use_inflate);
            break;
        case 'laser':
            watts -= Math.round(30 * use_inflate);
            break;
        case 'p_laser':
            watts -= Math.round(22 * use_inflate);
            break;
        case 'plasma':
            watts -= Math.round(50 * use_inflate);
            break;
        case 'phaser':
            watts -= Math.round(65 * use_inflate);
            break;
        case 'disrupter':
            watts -= Math.round(100 * use_inflate);
            break;
    }

    switch (ship.engine){
        case 'ion':
            watts -= Math.round(25 * use_inflate);
            break;
        case 'tie':
            watts -= Math.round(50 * use_inflate);
            break;
        case 'pulse':
            watts -= Math.round(40 * use_inflate);
            break;
        case 'photon':
            watts -= Math.round(75 * use_inflate);
            break;
        case 'vacuum':
            watts -= Math.round(120 * use_inflate);
            break;
    }

    switch (ship.sensor){
        case 'radar':
            watts -= Math.round(10 * use_inflate);
            break;
        case 'lidar':
            watts -= Math.round(25 * use_inflate);
            break;
        case 'quantum':
            watts -= Math.round(75 * use_inflate);
            break;
    }

    return watts;
}

function shipAttackPower(ship){
    let rating = 0;
    switch (ship.weapon){
        case 'railgun':
            rating = 18;
            break;
        case 'laser':
            rating = 32;
            break;
        case 'p_laser':
            rating = 27;
            break;
        case 'plasma':
            rating = 45;
            break;
        case 'phaser':
            rating = 57;
            break;
        case 'disrupter':
            rating = 78;
            break;
    }

    switch (ship.class){
        case 'corvette':
            return rating;
        case 'frigate':
            return Math.round(rating * 1.25);
        case 'destroyer':
            return Math.round(rating * 2);
        case 'cruiser':
            return Math.round(rating * 4.5);
        case 'battlecruiser':
            return Math.round(rating * 8);
        case 'dreadnought':
            return Math.round(rating * 22);
    }
}

function shipSpeed(ship){
    let mass = 1;
    switch (ship.class){
        case 'corvette':
            mass = ship.armor === 'neutronium' ? 1.1 : 1;
            break;
        case 'frigate':
            mass = ship.armor === 'neutronium' ? 1.35 : 1.25;
            break;
        case 'destroyer':
            mass = ship.armor === 'neutronium' ? 1.95 : 1.8;
            break;
        case 'cruiser':
            mass = ship.armor === 'neutronium' ? 3.5 : 3;
            break;
        case 'battlecruiser':
            mass = ship.armor === 'neutronium' ? 4.8 : 4;
            break;
        case 'dreadnought':
            mass = ship.armor === 'neutronium' ? 7.5 : 6;
            break;
    }

    switch (ship.engine){
        case 'ion':
            return 10 / mass;
        case 'tie':
            return 18 / mass;
        case 'pulse':
            return 15 / mass;
        case 'photon':
            return 20 / mass;
        case 'vacuum':
            return 25 / mass;
    }
}

function shipCosts(bp){
    let costs = {};

    let h_inflate = 1;
    switch (bp.class){
        case 'corvette':
            costs['Money'] = 2500000;
            costs['Aluminium'] = 500000;
            h_inflate = 1;
            break;
        case 'frigate':
            costs['Money'] = 5000000;
            costs['Aluminium'] = 1250000;
            h_inflate = 1.1;
            break;
        case 'destroyer':
            costs['Money'] = 15000000;
            costs['Aluminium'] = 3500000;
            h_inflate = 1.2;
            break;
        case 'cruiser':
            costs['Money'] = 50000000;
            costs['Aluminium'] = 12000000;
            h_inflate = 1.3;
            break;
        case 'battlecruiser':
            costs['Money'] = 125000000;
            costs['Aluminium'] = 32000000;
            h_inflate = 1.4;
            break;
        case 'dreadnought':
            costs['Money'] = 1000000000;
            costs['Aluminium'] = 128000000;
            h_inflate = 1.5;
            break;
    }

    switch (bp.armor){
        case 'steel':
            costs['Steel'] = Math.round(350000 ** h_inflate);
            break;
        case 'alloy':
            costs['Alloy'] = Math.round(250000 ** h_inflate);
            break;
        case 'neutronium':
            costs['Neutronium'] = Math.round(10000 ** h_inflate);
            break;
    }

    switch (bp.engine){
        case 'ion':
            costs['Titanium'] = Math.round(75000 ** h_inflate);
            break;
        case 'tie':
            costs['Titanium'] = Math.round(150000 ** h_inflate);
            break;
        case 'pulse':
            costs['Titanium'] = Math.round(125000 ** h_inflate);
            break;
        case 'photon':
            costs['Titanium'] = Math.round(225000 ** h_inflate);
            break;
        case 'vacuum':
            costs['Titanium'] = Math.round(350000 ** h_inflate);
            break;
    }

    switch (bp.power){
        case 'solar':
            costs['Copper'] = Math.round(40000 ** h_inflate);
            costs['Iridium'] = Math.round(15000 ** h_inflate);
            break;
        case 'diesel':
            costs['Copper'] = Math.round(40000 ** h_inflate);
            costs['Iridium'] = Math.round(15000 ** h_inflate);
            break;
        case 'fission':
            costs['Copper'] = Math.round(50000 ** h_inflate);
            costs['Iridium'] = Math.round(30000 ** h_inflate);
            break;
        case 'fusion':
            costs['Copper'] = Math.round(50000 ** h_inflate);
            costs['Iridium'] = Math.round(40000 ** h_inflate);
            break;
        case 'elerium':
            costs['Copper'] = Math.round(60000 ** h_inflate);
            costs['Iridium'] = Math.round(75000 ** h_inflate);
            break;
    }

    switch (bp.sensor){
        case 'radar':
            costs['Money'] = Math.round(costs['Money'] ** 1.05);
            break;
        case 'lidar':
            costs['Money'] = Math.round(costs['Money'] ** 1.12);
            break;
        case 'quantum':
            costs['Money'] = Math.round(costs['Money'] ** 1.25);
            break;
    }

    switch (bp.weapon){
        case 'railgun':
            costs['Iron'] = Math.round(25000 ** h_inflate);
            break;
        case 'laser':
            costs['Iridium'] = Math.round(costs['Iridium'] ** 1.05);
            costs['Nano_Tube'] = Math.round(12000 ** h_inflate);
            break;
        case 'p_laser':
            costs['Iridium'] = Math.round(costs['Iridium'] ** 1.035);
            costs['Nano_Tube'] = Math.round(12000 ** h_inflate);
            break;
        case 'plasma':
            costs['Iridium'] = Math.round(costs['Iridium'] ** 1.1);
            costs['Nano_Tube'] = Math.round(20000 ** h_inflate);
            break;
        case 'phaser':
            costs['Iridium'] = Math.round(costs['Iridium'] ** 1.175);
            costs['Nano_Tube'] = Math.round(35000 ** h_inflate);
            break;
        case 'disrupter':
            costs['Iridium'] = Math.round(costs['Iridium'] ** 1.25);
            costs['Nano_Tube'] = Math.round(65000 ** h_inflate);
            break;
    }

    return costs;
}


function drawShips(){
    clearElement($('#shipList'));
    let list = $('#shipList');

    const spaceRegions = spaceTech();

    for (let i=0; i<global.space.shipyard.ships.length; i++){
        let ship = global.space.shipyard.ships[i];
        
        let values = ``;
        Object.keys(spaceRegions).forEach(function(region){
            if (spaceRegions[region].info.hasOwnProperty('syndicate') && spaceRegions[region].info.syndicate){
                let name = typeof spaceRegions[region].info.name === 'string' ? spaceRegions[region].info.name : spaceRegions[region].info.name();
                values += `<b-dropdown-item aria-role="listitem" v-on:click="setLoc('${region}',${i})">${name}</b-dropdown-item>`;
            }
        });

        let location = typeof spaceRegions[ship.location].info.name === 'string' ? spaceRegions[ship.location].info.name : spaceRegions[ship.location].info.name();

        let dispatch = `<b-dropdown :triggers="['hover']" aria-role="list">
            <button class="button is-info" slot="trigger">
                <span>${location}</span>
            </button>${values}
        </b-dropdown>`;
        
        let ship_class = `${loc(`outer_shipyard_engine_${ship.engine}`)} ${loc(`outer_shipyard_class_${ship.class}`)}`;
        let desc = $(`<div class="shipRow ship${i}"></div>`);
        let row1 = $(`<div class="row1"><span class="has-text-caution">${ship.name}</span> | <span class="has-text-warning">${ship_class}</span> | <span class="has-text-danger">${loc(`outer_shipyard_weapon_${ship.weapon}`)}</span> | <span class="has-text-warning">${loc(`outer_shipyard_power_${ship.power}`)}</span> | <span class="has-text-warning">${loc(`outer_shipyard_armor_${ship.armor}`)}</span> | <span class="has-text-warning">${loc(`outer_shipyard_sensor_${ship.sensor}`)}</span></div>`);
        let row2 = $(`<div class="row2"><a class="scrap${i}" @click="scrap(${i})">${loc(`outer_shipyard_scrap`)}</a> | </div>`);
        let row3 = $(`<div class="location">${dispatch}</div>`);
        
        row2.append(`<span class="has-text-warning">${loc(`crew`)}</span> <span class="pad" v-html="crewText(${i})"></span>`);
        row2.append(`<span class="has-text-warning">${loc(`firepower`)}</span> <span class="pad" v-html="fireText(${i})"></span>`);
        row2.append(`<span class="has-text-warning">${loc(`outer_shipyard_sensors`)}</span> <span class="pad" v-html="sensorText(${i})"></span>`);
        row2.append(`<span class="has-text-warning">${loc(`speed`)}</span> <span class="pad" v-html="speedText(${i})"></span>`);
        row2.append(`<span v-show="show(${i})" class="has-text-caution" v-html="dest(${i})"></span>`);

        desc.append(row1);
        desc.append(row2);
        desc.append(row3); 
        list.append(desc);
    }

    vBind({
        el: `#shipList`,
        data: global.space.shipyard.ships,
        methods: {
            scrap(id){
                if (global.space.shipyard.ships[id]){
                    global.space.shipyard.ships.splice(id,1);
                    drawShips();
                }
            },
            setLoc(l,id){
                global.space.shipyard.ships[id].location = l;
                global.space.shipyard.ships[id].transit = Math.round(1000 / shipSpeed(global.space.shipyard.ships[id]));
                drawShips();
            },
            crewText(id){
                return shipCrewSize(global.space.shipyard.ships[id]);
            },
            fireText(id){
                return shipAttackPower(global.space.shipyard.ships[id]);
            },
            sensorText(id){
                switch (global.space.shipyard.ships[id].sensor){
                    case 'visual':
                        return `1km`;
                    case 'radar':
                        return `10km`;
                    case 'lidar':
                        return `20km`;
                    case 'quantum':
                        return `40km`;
                }
            },
            speedText(id){
                let speed = shipSpeed(global.space.shipyard.ships[id]);
                return +speed.toFixed(2);
            },
            dest(id){
                return loc(`outer_shipyard_arrive`,[
                    typeof spaceRegions[global.space.shipyard.ships[id].location].info.name === 'string' ? spaceRegions[global.space.shipyard.ships[id].location].info.name : spaceRegions[global.space.shipyard.ships[id].location].info.name(),
                    global.space.shipyard.ships[id].transit
                ]);
            },
            show(id){
                return global.space.shipyard.ships[id].transit > 0 ? true : false;
            }
        }
    });
}

export function syndicate(region,extra){
    if (global.tech['syndicate'] && global.race['truepath'] && global.space['syndicate'] && global.space.syndicate.hasOwnProperty(region)){
        let divisor = 5000;

        let rival = 0;
        if (global.civic.foreign.gov3.hstl < 10){
            rival = 2500 - (250 * global.civic.foreign.gov3.hstl);
        }
        else if (global.civic.foreign.gov3.hstl > 60){
            rival = (-65 * (global.civic.foreign.gov3.hstl - 60));
        }

        switch (region){
            case 'spc_home':
            case 'spc_moon':
            case 'spc_red':
            case 'spc_hell':
                divisor = 10000 + rival;
                break;
            case 'spc_gas':
            case 'spc_gas_moon':
            case 'spc_belt':
                divisor = 7600 + rival;
                break;
            case 'spc_titan':
            case 'spc_enceladus':
                divisor = 5000;
                break;
        }

        let piracy = global.space.syndicate[region];
        let patrol = 0;
        let sensor = 0;
        if (global.space.hasOwnProperty('shipyard') && global.space.shipyard.hasOwnProperty('ships')){
            global.space.shipyard.ships.forEach(function(ship){
                if (ship.location === region && ship.transit === 0){
                    let rating = shipAttackPower(ship);
                    patrol += ship.damage > 0 ? Math.round(rating * (100 - ship.damage) / 100) : rating;
                    switch (ship.sensor){
                        case 'visual':
                            sensor++;
                            break;
                        case 'radar':
                            sensor += 10;
                            break;
                        case 'lidar':
                            sensor += 20;
                            break;
                        case 'quantum':
                            sensor += 40;
                            break;
                    }
                }
            });
            
            patrol = Math.round(patrol * (sensor / 100));
            piracy = piracy - patrol > 0 ? piracy - patrol : 0;
        }

        if (extra){
            return {
                p: 1 - +(piracy / divisor).toFixed(4),
                r: piracy,
                s: sensor
            };
        }
        return 1 - +(piracy / divisor).toFixed(4);
    }

    if (extra){
        return { p: 1, r: 0, s: 0 };
    }
    return 1;
}