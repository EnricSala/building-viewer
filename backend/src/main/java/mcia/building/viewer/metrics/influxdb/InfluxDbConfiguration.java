package mcia.building.viewer.metrics.influxdb;

import org.hibernate.validator.constraints.NotEmpty;
import org.influxdb.InfluxDB;
import org.influxdb.InfluxDBFactory;
import org.influxdb.dto.Pong;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import mcia.building.viewer.metrics.MetricsRepository;

@Configuration
@ConfigurationProperties("influxdb")
@Slf4j
public class InfluxDbConfiguration implements InitializingBean {

	private @NotEmpty @Setter String host;
	private @NotEmpty @Setter String port;
	private @NotEmpty @Setter String user;
	private @NotEmpty @Setter String password;
	private @NotEmpty @Setter String database;

	@Bean
	public InfluxDB influxTemplate() {
		String influxUrl = "http://" + host + ":" + port;
		log.info("InfluxDB url: {}, database: {}", influxUrl, database);
		return InfluxDBFactory.connect(influxUrl, user, password);
	}

	@Bean
	public MetricsRepository influxMetricsRepository(InfluxDB influx) {
		return new InfluxMetricsRepository(influx, database);
	}

	@Override
	public void afterPropertiesSet() throws Exception {
		InfluxDB influx = influxTemplate();

		// Do a ping to check status
		Pong pong = influx.ping();
		log.info("Influx pong: {}, time {}", pong.getStatus(), pong.getResponseTime());
		if (!pong.getStatus().equalsIgnoreCase("ok")) {
			throw new RuntimeException("influx ping was not ok, it was " + pong.getStatus());
		}

		// Create the database
		try {
			influx.createDatabase(database);
			log.info("Created database {}", database);
		} catch (RuntimeException re) {
			log.info("Database {} already exists", database);
		}
	}

}
