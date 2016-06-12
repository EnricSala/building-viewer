package mcia.building.viewer;

import java.io.File;
import java.util.List;

import org.hibernate.validator.constraints.NotEmpty;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.Assert;
import org.springframework.web.method.support.HandlerMethodReturnValueHandler;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import mcia.building.viewer.rx.RxObservableReturnValueHandler;

@Configuration
@ConfigurationProperties("files")
@Slf4j
public class MvcConfiguration extends WebMvcConfigurerAdapter implements InitializingBean {

	@NotEmpty
	private @Setter String modelsDir = "";

	@Override
	public void afterPropertiesSet() throws Exception {
		log.info("Models directory: {}", modelsDir);
	}

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		if (!modelsDir.isEmpty()) {
			Assert.isTrue(new File(modelsDir).isDirectory(), "Cannot find models directory at: " + modelsDir);

			// The path must end with a separator, so make sure
			String path = modelsDir.endsWith(File.separator) ? modelsDir : modelsDir + File.separator;

			log.warn("Mapping {} to /models/**", path);
			registry
				.addResourceHandler("/models/**")
				.addResourceLocations("file:" + path);
		}
	}

	@Override
	public void addReturnValueHandlers(List<HandlerMethodReturnValueHandler> returnValueHandlers) {
		returnValueHandlers.add(new RxObservableReturnValueHandler());
	}

}
