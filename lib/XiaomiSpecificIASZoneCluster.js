'use strict';

const { IASZoneCluster, ZCLDataTypes } = require('zigbee-clusters');

class XiaomiSpecificIASZoneCluster extends IASZoneCluster {

  // Here we override the `COMMANDS` getter from the `ScenesClusters` by
  // extending it with the custom command we'd like to implement `ikeaSceneMove`.
  static get COMMANDS() {
    return {
      ...super.COMMANDS,
      zoneStatusChangeNotification: {
        id: 0,
        args: {
          zoneStatus: ZCLDataTypes.map16('alarm1', 'alarm2', 'tamper', 'battery', 'supervisionReports', 'restoreReports', 'trouble', 'acMains', 'test', 'batteryDefect'),
          extendedStatus: ZCLDataTypes.uint8,
          zoneID: ZCLDataTypes.uint8,
          delay: ZCLDataTypes.uint16,
        },
      },
    };
  }

  // It is also possible to implement manufacturer specific attributes, but beware, do not mix
  // these with regular attributes in one command (e.g. `Cluster#readAttributes` should be
  // called with only manufacturer specific attributes or only with regular attributes).
  static get ATTRIBUTES() {
    return {
      ...super.ATTRIBUTES,
      zoneState: {
        id: 0,
        type: ZCLDataTypes.enum8({
          notEnrolled: 0, // 0x00 Not enrolled
          Enrolled: 1, // 0x01 Enrolled (the client will react to Zone State Change Notification commands from the server)
        }),
      },
      zoneType: {
        id: 1,
        type: ZCLDataTypes.enum8({
          standardCIE: 0, // 0x0000 Standard CIE System Alarm -
          motionSensor: 13, // 0x000d Motion sensor Intrusion indication Presence indication
          contactSwitch: 21, // 0x0015 Contact switch 1st portal Open-Close 2nd portal Open-Close
          fireSensor: 40, // 0x0028 Fire sensor Fire indication -
          waterSensor: 42, // 0x002a Water sensor Water overflow indication -
          cabonMonoxideSensor: 43, // 0x002b Carbon Monoxide (CO) sensor CO indication Cooking indication
          personalEmergencyDevice: 44, // 0x002c Personal emergency device Fall/Concussion Emergency button
          vibrationMovementSensor: 45, // 0x002d Vibration/Movement sensor Movement indication Vibration
          remoteControl: 271, // 0x010f Remote Control Panic Emergency
          keyfob: 277, // 0x0115 Key fob Panic Emergency
          keypad: 541, // 0x021d Keypad Panic Emergency
          standardWarningDevice: 549, // 0x0225 Standard Warning Device
          glassBreakSensor: 550, // 0x0226 Glass break sensor Glass breakage detected -
          securityRepeaters: 553, // 0x0229 Security repeater* - -
          // 0x8000-0xfffe manufacturer specific types - -
          invalidZoneType: 65535, // 0xffff Invalid Zone Type
        }),
      },
      zoneStatus: {
        id: 2,
        type: ZCLDataTypes.map16('alarm1', 'alarm2', 'tamper', 'battery', 'supervisionReports', 'restoreReports', 'trouble', 'acMains', 'test', 'batteryDefect'),
      },

    };
  }

}

module.exports = XiaomiSpecificIASZoneCluster;
