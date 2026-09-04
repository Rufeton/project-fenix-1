resource "aws_subnet" "public" {
  for_each = {
    public_a = {
      cidr = "10.0.1.0/24"
      az   = "eu-south-2a"
    }

    public_b = {
      cidr = "10.0.2.0/24"
      az   = "eu-south-2b"
    }
  }

  vpc_id            = aws_vpc.fenix.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az

  tags = {
    Name = "fenix-${each.key}"
  }
}

resource "aws_subnet" "private" {
  for_each = {
    private_a = {
      cidr = "10.0.11.0/24"
      az   = "eu-south-2a"
    }

    private_b = {
      cidr = "10.0.12.0/24"
      az   = "eu-south-2b"
    }
  }

  vpc_id            = aws_vpc.fenix.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az

  tags = {
    Name = "fenix-${each.key}"
  }
}