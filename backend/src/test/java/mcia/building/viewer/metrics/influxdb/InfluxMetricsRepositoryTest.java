package mcia.building.viewer.metrics.influxdb;

import mcia.building.viewer.domain.Point;
import mcia.building.viewer.metrics.MetricsRepository;
import org.influxdb.InfluxDB;
import org.influxdb.dto.Serie;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import rx.observers.TestSubscriber;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.junit.Assert.assertEquals;

public class InfluxMetricsRepositoryTest {

	private static final String TEST_DB = "test-database";
	private static final String TEST_PORT = "8086";
	private static final String TEST_HOST = "localhost";
	private static final String TEST_USER = "root";
	private static final String TEST_PASSWORD = "root";

	private static InfluxDB influxTemplate;
	private static MetricsRepository metrics;

	@BeforeClass
	public static void setup() throws Exception {
		// Configure InfluxDB client and UUT
		InfluxDbConfiguration config = new InfluxDbConfiguration();
		config.setHost(TEST_HOST);
		config.setPort(TEST_PORT);
		config.setUser(TEST_USER);
		config.setPassword(TEST_PASSWORD);
		config.setDatabase(TEST_DB);
		config.afterPropertiesSet();
		influxTemplate = config.influxTemplate();
		metrics = config.influxMetricsRepository(influxTemplate);

		// Init database with some points
		List<Serie> list = new ArrayList<>();
		list.add(new Serie.Builder("test1").columns("time", "value")
				.values(System.currentTimeMillis(), 23.7).build());
		list.add(new Serie.Builder("test2").columns("time", "value")
				.values(System.currentTimeMillis(), 25.2).build());
		list.add(new Serie.Builder("white-list_ed charac.ters").columns("time", "value")
				.values(System.currentTimeMillis(), -5.4).build());
		Serie[] series = new Serie[list.size()];
		list.toArray(series);
		influxTemplate.write(TEST_DB, TimeUnit.MILLISECONDS, series);
	}

	@AfterClass
	public static void teardown() {
		influxTemplate.deleteDatabase("test-database");
	}

	@Test
	public void shouldQueryMultipleSeries() {
		Map<String, Point> result = metrics.queryLastPoint(
				Arrays.asList("test1", "test2")).toBlocking().single();
		assertEquals(2, result.size());
	}

	@Test
	public void shouldFailWhenSerieIsUnknown() {
		TestSubscriber<Map<String, Point>> sub = new TestSubscriber<>();
		metrics.queryLastPoint(Arrays.asList("unknown")).subscribe(sub);
		sub.assertError(RuntimeException.class);
	}

	@Test
	public void shouldRemoveInvalidCharacters() {
		Map<String, Point> result = metrics.queryLastPoint(
				Arrays.asList("t@e\":$st#1")).toBlocking().single();
		assertEquals(1, result.size());
	}

	@Test
	public void shouldAllowWhitelistedCharacters() {
		Map<String, Point> result = metrics.queryLastPoint(
				Arrays.asList("white-list_ed charac.ters")).toBlocking().single();
		assertEquals(1, result.size());
	}

	@Test
	public void emptyQueryShouldWork() {
		Map<String, Point> result = metrics.queryLastPoint(
				Arrays.asList()).toBlocking().single();
		assertEquals(0, result.size());
	}

}
