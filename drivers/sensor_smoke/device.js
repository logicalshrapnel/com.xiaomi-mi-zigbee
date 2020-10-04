'use strict';

const Homey = require('homey');

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { debug, Cluster, CLUSTER } = require('zigbee-clusters');

const IASZoneBoundCluster = require('../../lib/IASZoneBoundCluster');

const XiaomiBasicCluster = require('../../lib/XiaomiBasicCluster');

Cluster.addCluster(XiaomiBasicCluster);
// Cluster.addCluster(XiaomiSpecificIASZoneCluster);

// https://github.com/bspranger/Xiaomi/blob/master/devicetypes/a4refillpad/xiaomi-aqara-door-window-sensor.src/xiaomi-aqara-door-window-sensor.groovy
//  fingerprint profileId: "0104", deviceId: "0104",
// inClusters: "0000, 0003",
// outClusters: "0000, 0004",
// manufacturer: "LUMI", model: "lumi.sensor_magnet.aq2", deviceJoinName: "Xiaomi Aqara Door Sensor"

class AqaraSensorSmoke extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    // enable debugging
    // this.enableDebug();

    // Enables debug logging in zigbee-clusters
    // debug(true);

    // print the node's info to the console
    // this.printNode();

    zclNode.endpoints[1].bind(CLUSTER.IAS_ZONE.NAME, new IASZoneBoundCluster({
      onZoneStatusChangeNotification: this._commandHandler.bind(this),
    }));

    // Register the AttributeReportListener - Lifeline
    zclNode.endpoints[1].clusters[XiaomiBasicCluster.NAME]
      .on('attr.xiaomiLifeline', this.onXiaomiLifelineAttributeReport.bind(this));
  }

  /**
   * Trigger a Flow based on the `type` parameter.
   */
  _commandHandler(payload) {
    this.log('IASZoneNotification received:', payload);
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

module.exports = AqaraSensorSmoke;
