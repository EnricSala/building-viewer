package mcia.building.viewer.metrics.influxdb;

import mcia.building.viewer.domain.Point;
import mcia.building.viewer.metrics.MetricsRepository;
import org.influxdb.InfluxDB;
import org.junit.BeforeClass;
import org.junit.Test;
import rx.observers.TestSubscriber;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.Assert.*;

public class InfluxMetricsRepositoryTest {

	private static final String TEST_DB = "test-database";
	private static final String TEST_PORT = "8086";
	private static final String TEST_HOST = "localhost";
	private static final String TEST_USER = "root";
	private static final String TEST_PASSWORD = "root";

	private static final List<String> series = Arrays.asList("test1", "test2");

	private static MetricsRepository metrics;

	@BeforeClass
	public static void setup() throws Exception {
		InfluxDbConfiguration config = new InfluxDbConfiguration();
		config.setHost(TEST_HOST);
		config.setPort(TEST_PORT);
		config.setUser(TEST_USER);
		config.setPassword(TEST_PASSWORD);
		config.setDatabase(TEST_DB);
		config.afterPropertiesSet();

		InfluxDB influxTemplate = config.influxTemplate();
		metrics = config.influxMetricsRepository(influxTemplate);
	}

	@Test
	public void shouldQueryMultipleSeries() {
		Map<String, Point> result = metrics.queryLastPoint(series).toBlocking().single();
		assertEquals(series.size(), result.size());
	}

	@Test
	public void shouldFailWhenSerieIsUnknown() {
		TestSubscriber<Map<String, Point>> sub = new TestSubscriber<>();
		metrics.queryLastPoint(Arrays.asList("unknown")).subscribe(sub);
		sub.assertError(RuntimeException.class);
	}

	@Test
	public void shouldRemoveInvalidCharacters() {
		Map<String, Point> result =
				metrics.queryLastPoint(Arrays.asList("t@\"est#1")).toBlocking().single();
		assertEquals(1, result.size());
	}

}
