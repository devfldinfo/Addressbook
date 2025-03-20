.PHONY: cv

CC = xelatex
CV_DIR = my-awesome-cv/cv
CV_SRCS = my-awesome-cv/cv/sections.tex
PD_DIR = my-awesome-cv/cv/personal_data
PD_SRCS = $(shell find $(PD_DIR) -name '*.tex')

cv.pdf: output.tex
	$(CC) -output-directory=$(CV_DIR) $<

clean:
	rm -rf $(CV_DIR)/*.pdf
