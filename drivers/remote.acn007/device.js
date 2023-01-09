// SDK3 updated & validated : DONE

'use strict';

const Homey = require('homey');

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { debug, Cluster, CLUSTER } = require('zigbee-clusters');

const util = require('../../lib/util');
const XiaomiBasicCluster = require('../../lib/XiaomiBasicCluster');

Cluster.addCluster(XiaomiBasicCluster);

let lastKey = null;

class AqaraRemoteacn007 extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    // enable debugging
    // this.enableDebug();

    // Enables debug logging in zigbee-clusters
    // debug(true);

    // print the node's info to the console
    // this.printNode();

    // supported scenes and their reported attribute numbers (all based on reported data)
    this.sceneMap = {
      1: 'Key Pressed 1 time',
      2: 'Key Pressed 2 times',
      0: 'Key Held Down',
      255: 'Key Released',
    };

    zclNode.endpoints[1].clusters[CLUSTER.MULTI_STATE_INPUT.NAME]
      .on('attr.presentValue', this.onPresentValueAttributeReport.bind(this));

    zclNode.endpoints[1].clusters[XiaomiBasicCluster.NAME]
      .on('attr.xiaomiLifeline', this.onXiaomiLifelineAttributeReport.bind(this));

    // define and register FlowCardTriggers
    this.onSceneAutocomplete = this.onSceneAutocomplete.bind(this);
  }

  onPresentValueAttributeReport(repScene) {
    this.log('MultistateInputCluster - presentValue', repScene, this.sceneMap[repScene], 'lastKey', lastKey);

    if (lastKey !== repScene) {
      lastKey = repScene;
      if (Object.keys(this.sceneMap).includes(repScene.toString())) {
        const remoteValue = {
          scene: this.sceneMap[repScene],
        };
        this.debug('Scene and Button triggers', remoteValue);
        // Trigger the trigger card with 1 dropdown option
        this.triggerFlow({
          id: 'trigger_button1_scene',
          tokens: null,
          state: remoteValue,
        })
          .catch(err => this.error('Error triggering button1SceneTriggerDevice', err));

        // Trigger the trigger card with tokens
        this.triggerFlow({
          id: 'button1_button',
          tokens: remoteValue,
          state: remoteValue,
        })
          .catch(err => this.error('Error triggering button1ButtonTriggerDevice', err));

        // reset lastKey after the last trigger
        this.buttonLastKeyTimeout = setTimeout(() => {
          lastKey = null;
        }, 3000);
      }
    }
  }

  onSceneAutocomplete(query, args, callback) {
    let resultArray = [];
    for (const sceneID in this.sceneMap) {
      resultArray.push({
        id: this.sceneMap[sceneID],
        name: this.homey.__(this.sceneMap[sceneID]),
      });
    }
    // filter for query
    resultArray = resultArray.filter(result => {
      return result.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
    });
    this.debug(resultArray);
    return Promise.resolve(resultArray);
  }

  /**
   * Set `measure_temperature` when a `measureValue` attribute report is received on the
   * temperature measurement cluster.
   * @param {number} measuredValue
   */
  onBatteryVoltageAttributeReport(reportingClusterName, reportingAttribute, batteryVoltage) {
    if (typeof batteryVoltage === 'number') {
      const parsedBatPct = util.calculateBatteryPercentage(batteryVoltage * 100, '3V_2850_3000');
      if (this.hasCapability('measure_battery')) {
        this.log(`handle report (cluster: ${reportingClusterName}, attribute: ${reportingAttribute}, capability: measure_battery), parsed payload:`, parsedBatPct);
        this.setCapabilityValue('measure_battery', parsedBatPct).catch(this.error);
      }

      if (this.hasCapability('alarm_battery')) {
        this.log(`handle report (cluster: ${reportingClusterName}, attribute: ${reportingAttribute}, capability: alarm_battery), parsed payload:`, parsedBatPct < 20);
        this.setCapabilityValue('alarm_battery', parsedBatPct < 20).catch(this.error);
      }
    }
  }

  /**
   * This is Xiaomi's custom lifeline attribute, it contains a lot of data, af which the most
   * interesting the battery level. The battery level divided by 1000 represents the battery
   * voltage. If the battery voltage drops below 2600 (2.6V) we assume it is almost empty, based
   * on the battery voltage curve of a CR1632.
   * @param {{batteryLevel: number}} lifeline
   */
  onXiaomiLifelineAttributeReport({
    batteryVoltage,
  } = {}) {
    this.log('lifeline attribute report', {
      batteryVoltage,
    });

    if (typeof batteryVoltage === 'number') {
      this.onBatteryVoltageAttributeReport('AqaraLifeline', 'batteryVoltage', batteryVoltage / 100);
    }
  }

}
module.exports = AqaraRemoteacn007;

// WXKG20LM_ remote.acn007
/*
Node overview:
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] ------------------------------------------
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] Node: f5b42996-97aa-45d8-a8c4-b45772286c06??
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] - Battery: false
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] - Endpoints: 0
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] -- Clusters:
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] --- zapp
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] --- genBasic
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] ---- 65281 : !�
                                                                               (!�!�$
!
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] ---- cid : genBasic
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] ---- sid : attrs
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] ---- modelId : lumi.remote.acn007
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] --- genIdentify
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] ---- cid : genIdentify
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] ---- sid : attrs
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] --- genMultistateInput
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] ---- cid : genMultistateInput
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] ---- sid : attrs
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] ---- presentValue : 255
2018-10-13 17:15:04 [log] [ManagerDrivers] [remote.acn007] [0] ------------------------------------------
*/
