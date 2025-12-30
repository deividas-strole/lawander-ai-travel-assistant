package com.coderscampus.lawander;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(exclude = { 
    org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
    org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class 
})
public class LawanderApplication {

	public static void main(String[] args) {
		SpringApplication.run(LawanderApplication.class, args);
	} 
}
