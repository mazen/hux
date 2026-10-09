# hux owns its device model; Home Assistant and others are optional Drivers

hux has its own Device model and event/command layer, and every protocol or ecosystem (Matter, Zigbee, MQTT, Meross, Govee, vehicle clouds, and Home Assistant as a bridge) plugs in as a Driver. We rejected "integrate with Home Assistant and stop there", even though it would be much less work, because it makes "first set up Home Assistant" a prerequisite, which defeats the goal of being easy for people who are not technical. Existing Home Assistant users still get all their devices at once through the bridge Driver.
