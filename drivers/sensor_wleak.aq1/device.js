'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { debug, Cluster, CLUSTER } = require('zigbee-clusters');

// const XiaomiSpecificIASZoneCluster = require('../../lib/XiaomiSpecificIASZoneCluster');
const IASZoneBoundCluster = require('../../lib/IASZoneBoundCluster');
const XiaomiBasicCluster = require('../../lib/XiaomiBasicCluster');

// Cluster.addCluster(XiaomiSpecificIASZoneCluster);
Cluster.addCluster(XiaomiBasicCluster);

class AqaraWaterSensor extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    // enable debugging
    this.enableDebug();

    // Enables debug logging in zigbee-clusters
    debug(true);

    // print the node's info to the console
    // this.printNode();

    zclNode.endpoints[1].bind(CLUSTER.IAS_ZONE.NAME, new IASZoneBoundCluster({
      onZoneStatusChangeNotification: this._commandHandler.bind(this, 'zoneStatusChangeNotification'),
    }));

    // Register the AttributeReportListener - Lifeline
    // zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME]
    //  .on('attr.zoneStatus', this._commandHandler.bind(this));

    // Register the AttributeReportListener - Lifeline
    zclNode.endpoints[1].clusters[XiaomiBasicCluster.NAME]
      .on('attr.xiaomiLifeline', this.onXiaomiLifelineAttributeReport.bind(this));
  }

  /**
   * Trigger a Flow based on the `type` parameter.
   */
  _commandHandler(command, payload) {
    this.log('IASZoneNotification received:', command, payload);
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
      const parsedVolts = batteryVoltage / 1000;
      const minVolts = 2.5;
      const maxVolts = 3.0;
      const parsedBatPct = Math.min(100, Math.round((parsedVolts - minVolts) / (maxVolts - minVolts) * 100));
      this.setCapabilityValue('measure_battery', parsedBatPct);
      this.setCapabilityValue('alarm_battery', batteryVoltage < 2600).catch(this.error);
    }
  }

}

module.exports = AqaraWaterSensor;

/*
Alarm:
2020-10-03T06:13:10.368Z zigbee-clusters:endpoint ep: 1, cl: iasZone (1280), error while handling frame unknown_command_received {
  meta: { transId: 0, linkQuality: 102, dstEndpoint: 1, timestamp: 7144012 },
  frame: ZCLStandardHeader {
    frameControl: Bitmap [ clusterSpecific, directionToClient, disableDefaultResponse ],
    trxSequenceNumber: 3,
    cmdId: 0,
    data: <Buffer 01 00 00 ff 00 00>
  }
}

2020-10-03T06:13:28.505Z zigbee-clusters:endpoint ep: 1, cl: iasZone (1280), error while handling frame unknown_command_received {
  meta: { transId: 0, linkQuality: 102, dstEndpoint: 1, timestamp: 7200780 },
  frame: ZCLStandardHeader {
    frameControl: Bitmap [ clusterSpecific, directionToClient, disableDefaultResponse ],
    trxSequenceNumber: 4,
    cmdId: 0,
    data: <Buffer 00 00 00 ff 00 00>
  }
}

2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ------------------------------------------
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] Node: ccdc2a0a-a438-42d3-a3d7-4de0de5e21e4
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] - Battery: false
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] - Endpoints: 0
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] -- Clusters:
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] --- zapp
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] --- genBasic
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- cid : genBasic
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- sid : attrs
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] --- genPowerCfg
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- cid : genPowerCfg
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- sid : attrs
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] --- genIdentify
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- cid : genIdentify
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- sid : attrs
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] --- genOta
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- cid : genOta
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ---- sid : attrs
2017-10-29 19:03:00 [log] [ManagerDrivers] [sensor_wleak.aq1] [0] ------------------------------------------
*/
